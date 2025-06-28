import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Helmet } from 'react-helmet-async';
import { toast } from '@/hooks/use-toast';
import { PaymentForm } from '@/components/PaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

const countryList = [
  { code: 'AL', name: 'Shqipëri' },
  { code: 'XK', name: 'Kosovë' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  // ... add more countries as needed
];

interface PackageData {
  id: string;
  name: { al: string; en: string } | string;
  sale_price: number;
  data_amount: number;
  validity_days: number;
  country_name: { al: string; en: string } | string;
}

const CheckoutPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [country, setCountry] = useState(countryList[0].code);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [coupon, setCoupon] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Accept both ?packageId=... and ?package=...
  const packageId = searchParams.get('packageId') || searchParams.get('package');

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/frontend-packages?lang=${language}`);
        const packages = await response.json();
        const packageItem = packages.find((pkg: PackageData) => pkg.id === packageId);
        if (packageItem) {
          setPackageData(packageItem);
        } else {
          toast({
            title: t('package_not_found'),
            description: t('selected_package_not_found'),
            variant: 'destructive',
          });
          navigate('/packages');
        }
      } catch (error) {
        toast({
          title: t('error'),
          description: t('failed_to_load_package_details'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (packageId) fetchPackageData();
    else setIsLoading(false);
  }, [packageId, language, navigate, t]);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    navigate('/checkout/success?payment_intent_id=' + paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: t('payment_failed'),
      description: error,
      variant: 'destructive',
    });
  };

  const handleApplyCoupon = () => {
    // Dummy coupon logic for demo
    if (coupon.trim().toLowerCase() === 'nice') {
      setDiscount(2); // €2 discount
      setIsCouponApplied(true);
      toast({ title: t('coupon_applied'), description: '-2€', variant: 'success' });
    } else {
      setDiscount(0);
      setIsCouponApplied(false);
      toast({ title: t('invalid_coupon'), description: t('please_try_another_coupon'), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!packageData) return null;

  const total = Math.max(0, packageData.sale_price - discount);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>{t('checkout')} - eSIMFly</title>
        <meta name="description" content={t('checkout_description')} />
      </Helmet>
      <div className="flex flex-1 flex-col md:flex-row max-w-5xl mx-auto w-full py-6 md:py-12 gap-4 md:gap-8 px-2 md:px-0">
        {/* Left: Form */}
        <div className="flex-1 bg-white rounded-xl shadow p-4 md:p-8 mb-4 md:mb-0">
          <h2 className="text-2xl font-bold mb-6 md:mb-8 text-gray-900">{t('checkout')}</h2>
          <form className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('first_name')} *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={t('enter_first_name')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('last_name')} *</label>
                <input type="text" value={surname} onChange={e => setSurname(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={t('enter_last_name')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone_number')} ({t('kosovo_only')})</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="XXX XXX XXX" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('country')}</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  {countryList.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={t('enter_email')} />
              </div>
            </div>
            {/* Stripe Elements Payment Form */}
            <Elements stripe={stripePromise}>
              <PaymentForm
                amount={total}
                currency="eur"
                email={email}
                packageId={packageData.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </form>
        </div>
        {/* Right: Order Summary */}
        <div className="w-full md:w-96 bg-gradient-to-b from-purple-800 to-purple-600 rounded-xl shadow p-4 md:p-8 text-white flex flex-col">
          <h3 className="text-xl font-bold mb-4 md:mb-6">{t('your_order')}</h3>
          <div className="mb-2 md:mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">
                {typeof packageData.name === 'string' ? packageData.name : packageData.name[language]}
              </span>
              <span className="font-bold text-lg">€{packageData.sale_price.toFixed(2)}</span>
            </div>
            <div className="text-sm opacity-80 mt-1">
              {packageData.data_amount}GB eSIM {packageData.country_name && (typeof packageData.country_name === 'string' ? packageData.country_name : packageData.country_name[language])} / {packageData.validity_days} {t('days')}
            </div>
            <div className="text-sm opacity-80 mt-1">Qty 1</div>
          </div>
          <div className="mb-2 md:mb-4">
            <input
              type="text"
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              placeholder={t('discount_coupon') + ' (' + t('if_any') + ')'}
              className="w-full px-3 py-2 rounded-lg border border-purple-300 text-gray-900 focus:ring-2 focus:ring-purple-300 focus:border-transparent mb-2"
              disabled={isCouponApplied}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              disabled={isCouponApplied}
            >
              {isCouponApplied ? t('coupon_applied') : t('apply_coupon')}
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 md:mt-4 border-t border-purple-400 pt-2 md:pt-4">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-2xl">€{total.toFixed(2)}</span>
          </div>
          <div className="text-xs opacity-80 mt-2 md:mt-4">EUR</div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;