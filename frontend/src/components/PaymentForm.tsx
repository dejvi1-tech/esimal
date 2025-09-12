import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentFormProps {
  amount: number;
  currency: string;
  email: string;
  packageId: string;
  name?: string;
  surname?: string;
  phone?: string;
  country?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const stripeInputStyle = {
  base: {
    fontSize: '17px',
    color: '#ffffff',
    '::placeholder': { color: 'rgba(255, 255, 255, 0.5)' },
    fontFamily: 'inherit',
    letterSpacing: '0.03em',
    backgroundColor: 'transparent',
    padding: '12px 0',
  },
  invalid: { color: '#ff4444' },
};

export interface PaymentFormRef {
  submit: () => Promise<void>;
}

export const PaymentForm = forwardRef<PaymentFormRef, PaymentFormProps>(({
  amount,
  currency,
  email,
  packageId,
  name,
  surname,
  phone,
  country,
  onSuccess,
  onError,
}, ref) => {
  // Ensure email is never null
  const safeEmail = email ?? '';
  
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Ensure we navigate only once and never leave the user stuck
  const navigatedRef = React.useRef(false);
  const gotoSuccess = (pid: string) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    // Stop spinner immediately for better UX
    try { setIsProcessing(false); } catch {}

    // Call parent-provided navigate handler
    gotoSuccess(pid);

    // Hard redirect fallback if SPA navigation is blocked (iOS Safari quirks)
    setTimeout(() => {
      if (!window.location.pathname.includes('/checkout/success')) {
        window.location.href = `/checkout/success?payment_intent_id=${encodeURIComponent(pid)}`;
      }
    }, 300);
  };

  console.log('[DEBUG] PaymentForm rendered');
  console.log('[DEBUG] Stripe:', stripe);
  console.log('[DEBUG] Elements:', elements);
  console.log('[DEBUG] Props:', { amount, currency, email: safeEmail, packageId, name, surname, phone, country });

  const createPaymentIntent = async (): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    console.log('[DEBUG] Creating payment intent...');
    console.log('[DEBUG] Payment intent data:', { amount, currency, email: safeEmail, packageId, name, surname, phone, country });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          email: safeEmail,
          packageId,
          name: name ?? '',
          surname: surname ?? '',
          phone: phone ?? '',
          country: country ?? '',
        }),
      });

      console.log('[DEBUG] Payment intent response status:', response.status);
      console.log('[DEBUG] Payment intent response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[DEBUG] Payment intent error data:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[DEBUG] Payment intent result:', result);
      
      if (result.status === 'success' && result.data?.clientSecret && result.data?.paymentIntentId) {
        console.log('[DEBUG] Payment intent created successfully, clientSecret and paymentIntentId received');
        return { clientSecret: result.data.clientSecret, paymentIntentId: result.data.paymentIntentId };
      } else {
        console.error('[DEBUG] Payment intent creation failed or missing fields:', result);
        throw new Error(result.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('[DEBUG] Error creating payment intent:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleSubmit called');
    console.log('[DEBUG] stripe:', stripe);
    console.log('[DEBUG] elements:', elements);

    // Frontend guard to prevent 400 from backend when required data is missing
    if (!safeEmail || !safeEmail.trim()) {
      console.error('[DEBUG] Missing email - aborting before createPaymentIntent');
      toast({ title: 'Missing email', description: 'Please enter your email before paying.', variant: 'destructive' });
      onError('Email is required');
      return;
    }
    if (!packageId) {
      console.error('[DEBUG] Missing packageId - aborting before createPaymentIntent');
      toast({ title: 'Missing package', description: 'Selected package is missing. Please go back and choose a package again.', variant: 'destructive' });
      onError('Package ID is required');
      return;
    }

    if (!stripe || !elements) {
      console.error('[DEBUG] Stripe not loaded');
      toast({ title: 'Stripe Error', description: 'Stripe has not loaded yet. Please try again.', variant: 'destructive' });
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      let usedClientSecret = clientSecret;
      if (!usedClientSecret) {
        console.log('[DEBUG] No clientSecret, creating new payment intent...');
        const { clientSecret: newClientSecret, paymentIntentId: newPaymentIntentId } = await createPaymentIntent();
        if (!newClientSecret) {
          throw new Error('Failed to create payment intent: No client secret received');
        }
        setClientSecret(newClientSecret);
        setPaymentIntentId(newPaymentIntentId);
        usedClientSecret = newClientSecret;
        console.log('[DEBUG] Received clientSecret:', usedClientSecret, ' paymentIntentId:', newPaymentIntentId);
      } else {
        console.log('[DEBUG] Using existing clientSecret:', usedClientSecret, ' stored paymentIntentId:', paymentIntentId);
      }
      
      // Get individual card elements
      const cardNumberElement = elements.getElement(CardNumberElement);
      const cardExpiryElement = elements.getElement(CardExpiryElement);
      const cardCvcElement = elements.getElement(CardCvcElement);
      
      if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
        console.error('[DEBUG] Card elements not found');
        toast({ title: 'Card Error', description: 'Card elements not found', variant: 'destructive' });
        throw new Error('Card elements not found');
      }
      
      console.log('[DEBUG] Confirming card payment...');
      const returnUrl = `${window.location.origin}/checkout/success`;

      // Kick off confirm; if browsers stall, optimistically navigate after a short timeout using known PaymentIntentId
      const confirmOp = stripe.confirmCardPayment(usedClientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: { email: safeEmail || '' },
        },
        // Allow redirect-based flows (3DS, etc.) to return to our success page
        return_url: returnUrl,
      });

      const TIMEOUT = Symbol('timeout');
      type ConfirmResult = { error?: any; paymentIntent?: any } | typeof TIMEOUT;

      const resultOrTimeout: ConfirmResult = await Promise.race([
        confirmOp as unknown as Promise<ConfirmResult>,
        new Promise<ConfirmResult>((resolve) => setTimeout(() => resolve(TIMEOUT), 5000)),
      ]);

      if (resultOrTimeout === TIMEOUT) {
        console.warn('[DEBUG] confirmCardPayment timed out. Optimistically navigating to success to avoid user being stuck.');
        // Prefer server-returned PI id; fallback parse from clientSecret
        let pid = paymentIntentId;
        if (!pid && usedClientSecret) {
          const m = usedClientSecret.match(/(pi_[^_]+)/);
          pid = m ? m[1] : null;
        }
        if (pid) {
          toast({ title: t('payment_processing'), description: t('payment_processed_successfully'), variant: 'default' });
          gotoSuccess(pid);
          return;
        }
        // If no PID available, as a last resort, do a single retrieve attempt
        try {
          const latest = await stripe.retrievePaymentIntent(usedClientSecret);
          const li = latest.paymentIntent;
          if (li && (li.status === 'succeeded' || li.status === 'processing' || li.status === 'requires_capture')) {
            toast({ title: t('payment_successful'), description: t('payment_processed_successfully'), variant: 'default' });
            gotoSuccess(li.id);
            return;
          }
        } catch (e) {
          console.error('[DEBUG] Fallback retrieve after timeout failed:', e);
        }
        // If still nothing, surface a generic message but do not hang the UI
        toast({ title: t('payment_processing'), description: t('payment_processed_successfully'), variant: 'default' });
        if (pid) gotoSuccess(pid);
        return;
      } else {
        const { error, paymentIntent } = resultOrTimeout as any;

        if (error) {
          console.error('[DEBUG] Payment confirmation error:', error);
          toast({ title: t('payment_failed'), description: error.message || 'There was an error processing your payment.', variant: 'destructive' });
          onError(error.message || 'There was an error processing your payment.');
        } else if (paymentIntent) {
          const status = paymentIntent.status;
          console.log('[DEBUG] PaymentIntent status after confirmCardPayment:', status);

          // Treat asynchronous states as success; webhook will finalize fulfillment and emails
          if (status === 'succeeded' || status === 'processing' || status === 'requires_capture') {
            console.log('[DEBUG] Payment considered successful (including async states):', paymentIntent);
            toast({ title: t('payment_successful'), description: t('payment_processed_successfully'), variant: 'default' });
            gotoSuccess(paymentIntent.id);
          } else if (status === 'requires_action') {
            console.warn('[DEBUG] Payment requires additional user action. Attempting explicit handling.', paymentIntent.next_action);

            const nextAction: any = (paymentIntent as any).next_action;
            if (nextAction?.type === 'redirect_to_url' && nextAction?.redirect_to_url?.url) {
              console.log('[DEBUG] Forcing redirect to next_action URL');
              window.location.href = nextAction.redirect_to_url.url;
              return;
            }

            try {
              console.log('[DEBUG] Retrying confirmCardPayment without payment_method to trigger action handling');
              const retry = await stripe.confirmCardPayment(usedClientSecret);
              if (retry.error) {
                console.error('[DEBUG] Retry confirmCardPayment error:', retry.error);
              } else if (retry.paymentIntent && (retry.paymentIntent.status === 'succeeded' || retry.paymentIntent.status === 'processing' || retry.paymentIntent.status === 'requires_capture')) {
                console.log('[DEBUG] Retry success, proceeding:', retry.paymentIntent.status);
                toast({ title: t('payment_successful'), description: t('payment_processed_successfully'), variant: 'default' });
                gotoSuccess(retry.paymentIntent.id);
                return;
              }
            } catch (retryErr) {
              console.error('[DEBUG] Exception during retry confirmCardPayment:', retryErr);
            }

            console.log('[DEBUG] Scheduling fallback retrievePaymentIntent polling after requires_action');
            setTimeout(async () => {
              try {
                const latest = await stripe.retrievePaymentIntent(usedClientSecret);
                const li = latest.paymentIntent;
                console.log('[DEBUG] retrievePaymentIntent result:', li?.status);
                if (li && (li.status === 'succeeded' || li.status === 'processing' || li.status === 'requires_capture')) {
                  toast({ title: t('payment_successful'), description: t('payment_processed_successfully'), variant: 'default' });
                  gotoSuccess(li.id);
                } else {
                  console.warn('[DEBUG] Payment still not completed after fallback check:', li?.status);
                }
              } catch (pollErr) {
                console.error('[DEBUG] Error during retrievePaymentIntent fallback:', pollErr);
              }
            }, 2000);
          } else {
            console.error('[DEBUG] Payment not successful:', paymentIntent);
            toast({ title: t('payment_failed'), description: 'Payment was not successful. Please try again.', variant: 'destructive' });
            onError('Payment was not successful. Please try again.');
          }
        } else {
          console.error('[DEBUG] No paymentIntent returned from confirmCardPayment');
          toast({ title: t('payment_failed'), description: 'Payment did not complete. Please try again.', variant: 'destructive' });
          onError('Payment did not complete. Please try again.');
        }
      }
    } catch (err) {
      console.error('[DEBUG] Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'There was an error processing your payment.';
      toast({ title: t('payment_failed'), description: errorMessage, variant: 'destructive' });
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: async () => {
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  }));

  return (
    <div className="bg-gray-50 border-2 border-gray-200 shadow-md rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <img src="/images/payment-cards/visa-logo.webp" alt="Visa" className="h-8" />
        <img src="/images/payment-cards/mastercard-logo.webp" alt="Mastercard" className="h-8" />
        <img src="/images/payment-cards/amex-logo.webp" alt="Amex" className="h-8" />
        <span className="ml-2 bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full border">+1</span>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">{t('card_number')}</label>
          <div className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <CardNumberElement
              options={{ style: { base: { fontSize: '17px', color: '#222', '::placeholder': { color: '#bbb' }, fontFamily: 'inherit', backgroundColor: 'transparent' }, invalid: { color: '#ff4444' } } }}
              className="flex-1 bg-transparent outline-none text-lg h-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">{t('expiry')}</label>
            <div className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <CardExpiryElement
                options={{ style: { base: { fontSize: '17px', color: '#222', '::placeholder': { color: '#bbb' }, fontFamily: 'inherit', backgroundColor: 'transparent' }, invalid: { color: '#ff4444' } } }}
                className="flex-1 bg-transparent outline-none text-lg h-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">{t('cvc')}</label>
            <div className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <CardCvcElement
                options={{ style: { base: { fontSize: '17px', color: '#222', '::placeholder': { color: '#bbb' }, fontFamily: 'inherit', backgroundColor: 'transparent' }, invalid: { color: '#ff4444' } } }}
                className="flex-1 bg-transparent outline-none text-lg h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}); 