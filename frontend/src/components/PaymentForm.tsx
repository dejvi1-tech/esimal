import React, { useState } from 'react';
import { CardElement, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentFormProps {
  amount: number;
  currency: string;
  email: string;
  packageId: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const stripeInputStyle = {
  base: {
    fontSize: '17px',
    color: '#222',
    '::placeholder': { color: '#bbb' },
    fontFamily: 'inherit',
    letterSpacing: '0.03em',
    backgroundColor: 'transparent',
    padding: '12px 0',
  },
  invalid: { color: '#e53e3e' },
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency,
  email,
  packageId,
  onSuccess,
  onError,
}) => {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const createPaymentIntent = async () => {
    console.log('[DEBUG] Creating payment intent...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          email,
          packageId,
        }),
      });

      console.log('[DEBUG] Payment intent response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[DEBUG] Payment intent error data:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[DEBUG] Payment intent result:', result);
      
      if (result.status === 'success') {
        return result.data.clientSecret;
      } else {
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
    if (!stripe || !elements) {
      console.error('[DEBUG] Stripe not loaded');
      toast({ title: 'Stripe Error', description: 'Stripe has not loaded yet. Please try again.', variant: 'destructive' });
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }
    setIsProcessing(true);
    try {
      if (!clientSecret) {
        console.log('[DEBUG] No clientSecret, creating new payment intent...');
        const newClientSecret = await createPaymentIntent();
        setClientSecret(newClientSecret);
        console.log('[DEBUG] Received clientSecret:', newClientSecret);
      } else {
        console.log('[DEBUG] Using existing clientSecret:', clientSecret);
      }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        console.error('[DEBUG] Card element not found');
        toast({ title: 'Card Error', description: 'Card element not found', variant: 'destructive' });
        throw new Error('Card element not found');
      }
      console.log('[DEBUG] Confirming card payment...');
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret!, {
        payment_method: {
          card: cardElement,
          billing_details: { email: email },
        },
      });
      if (error) {
        console.error('[DEBUG] Payment confirmation error:', error);
        toast({ title: t('payment_failed'), description: error.message || 'There was an error processing your payment.', variant: 'destructive' });
        onError(error.message || 'There was an error processing your payment.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('[DEBUG] Payment successful:', paymentIntent);
        toast({ title: t('payment_successful'), description: t('payment_processed_successfully'), variant: 'success' });
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
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-6 text-gray-900">{t('payment_details')}</h3>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('card_number')}</label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all" style={{height: 52}}>
              <CardNumberElement
                options={{ style: stripeInputStyle }}
                className="flex-1 bg-transparent outline-none text-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expiry')}</label>
              <div className="relative flex items-center border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all" style={{height: 52}}>
                <CardExpiryElement
                  options={{ style: stripeInputStyle }}
                  className="flex-1 bg-transparent outline-none text-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('cvc')}</label>
              <div className="relative flex items-center border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all" style={{height: 52}}>
                <CardCvcElement
                  options={{ style: stripeInputStyle }}
                  className="flex-1 bg-transparent outline-none text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? t('processing') : `${t('pay')} ${currency.toUpperCase()} ${amount}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        {t('payment_terms_notice')}
      </p>
    </form>
  );
}; 