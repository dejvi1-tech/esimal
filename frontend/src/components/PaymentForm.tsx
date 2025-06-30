import React, { useState } from 'react';
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

export const PaymentForm: React.FC<PaymentFormProps> = ({
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
}) => {
  // Ensure email is never null
  const safeEmail = email ?? '';
  
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  console.log('[DEBUG] PaymentForm rendered');
  console.log('[DEBUG] Stripe:', stripe);
  console.log('[DEBUG] Elements:', elements);
  console.log('[DEBUG] Props:', { amount, currency, email: safeEmail, packageId, name, surname, phone, country });

  const createPaymentIntent = async () => {
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
      
      if (result.status === 'success') {
        console.log('[DEBUG] Payment intent created successfully, clientSecret received');
        return result.data.clientSecret;
      } else {
        console.error('[DEBUG] Payment intent creation failed:', result);
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
        usedClientSecret = await createPaymentIntent();
        if (!usedClientSecret) {
          throw new Error('Failed to create payment intent: No client secret received');
        }
        setClientSecret(usedClientSecret);
        console.log('[DEBUG] Received clientSecret:', usedClientSecret);
      } else {
        console.log('[DEBUG] Using existing clientSecret:', usedClientSecret);
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
      const { error, paymentIntent } = await stripe.confirmCardPayment(usedClientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: { email: safeEmail || '' },
        },
      });
      if (error) {
        console.error('[DEBUG] Payment confirmation error:', error);
        toast({ title: t('payment_failed'), description: error.message || 'There was an error processing your payment.', variant: 'destructive' });
        onError(error.message || 'There was an error processing your payment.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('[DEBUG] Payment successful:', paymentIntent);
        toast({ title: t('payment_successful'), description: t('payment_processed_successfully'), variant: 'default' });
        onSuccess(paymentIntent.id);
      } else {
        console.error('[DEBUG] Payment failed:', paymentIntent);
        toast({ title: t('payment_failed'), description: 'Payment was not successful. Please try again.', variant: 'destructive' });
        onError('Payment was not successful. Please try again.');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-medium p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6 text-white">{t('payment_details')}</h3>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white mb-1">{t('card_number')}</label>
            <div className="input-glass w-full text-white" style={{height: 52}}>
              <CardNumberElement
                options={{ style: stripeInputStyle }}
                className="flex-1 bg-transparent outline-none text-lg h-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">{t('expiry')}</label>
              <div className="input-glass w-full text-white" style={{height: 52}}>
                <CardExpiryElement
                  options={{ style: stripeInputStyle }}
                  className="flex-1 bg-transparent outline-none text-lg h-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">{t('cvc')}</label>
              <div className="input-glass w-full text-white" style={{height: 52}}>
                <CardCvcElement
                  options={{ style: stripeInputStyle }}
                  className="flex-1 bg-transparent outline-none text-lg h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="btn-glass w-full text-white py-4 px-6 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? t('processing') : `${t('pay')} ${currency.toUpperCase()} ${amount}`}
      </button>

      <p className="text-xs text-white/80 text-center">
        {t('payment_terms_notice')}
      </p>
    </form>
  );
}; 