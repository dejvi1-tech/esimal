import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PaymentForm, PaymentFormRef } from '@/components/PaymentForm';
import europeFlag from '../assets/images/europe.png';
import italyFlag from '../assets/images/italy.png';
import { europeanCountries } from '@/data/countries';

console.log('VITE_STRIPE_PUBLIC_KEY:', import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
  image?: string;
}

// ErrorBoundary component
class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('CheckoutPage ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unexpected Error</h2>
              <p className="text-gray-600">Something went wrong. Please try again or contact support.</p>
            </div>
            <button
              onClick={() => window.location.href = '/packages'}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Browse Packages
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const CheckoutPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [coupon, setCoupon] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [storedPackageId, setStoredPackageId] = useState<string | null>(null);
  const paymentFormRef = useRef<PaymentFormRef>(null);

  // Accept both ?packageId=... and ?package=...
  const packageId = searchParams.get('packageId') || searchParams.get('package');

  // Store packageId in state to prevent loss during payment process
  useEffect(() => {
    if (packageId && !storedPackageId) {
      console.log('[DEBUG] Storing packageId:', packageId);
      setStoredPackageId(packageId);
      // Also store in localStorage as backup
      localStorage.setItem('checkout_package_id', packageId);
    }
  }, [packageId, storedPackageId]);

  // Use stored packageId if URL packageId is lost
  const effectivePackageId = packageId || storedPackageId || localStorage.getItem('checkout_package_id');
  
  console.log('[DEBUG] CheckoutPage render - packageId:', packageId, 'storedPackageId:', storedPackageId, 'effectivePackageId:', effectivePackageId);

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        console.log('[DEBUG] fetchPackageData called with packageId:', effectivePackageId);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/frontend-packages?lang=${language}`);
        const packages = await response.json();
        const packageItem = packages.find((pkg: PackageData) => pkg.id === effectivePackageId);
        if (packageItem) {
          console.log('[DEBUG] Package found:', packageItem);
          setPackageData(packageItem);
        } else {
          console.error('[DEBUG] Package not found for ID:', effectivePackageId);
          toast({
            title: t('package_not_found'),
            description: t('selected_package_not_found'),
            variant: 'destructive',
          });
          navigate('/packages');
        }
      } catch (error) {
        console.error('[DEBUG] fetchPackageData error:', error);
        toast({
          title: t('error'),
          description: t('failed_to_load_package_details'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (effectivePackageId) fetchPackageData();
    else setIsLoading(false);
  }, [effectivePackageId, language, navigate, t]);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('[DEBUG] Payment successful, cleaning up localStorage');
    localStorage.removeItem('checkout_package_id');
    navigate('/checkout/success?payment_intent_id=' + paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    console.error('[DEBUG] handlePaymentError:', error);
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
      toast({ title: t('coupon_applied'), description: '-2€', variant: 'default' });
    } else {
      setDiscount(0);
      setIsCouponApplied(false);
      toast({ title: t('invalid_coupon'), description: t('please_try_another_coupon'), variant: 'destructive' });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] Main form submit - calling PaymentForm submit');
    if (paymentFormRef.current) {
      await paymentFormRef.current.submit();
    }
  };

  // Cleanup localStorage on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if we're not navigating to success page
      if (!window.location.pathname.includes('/checkout/success')) {
        localStorage.removeItem('checkout_package_id');
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!effectivePackageId) {
    console.error('[DEBUG] No effectivePackageId found - showing error page');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('no_package_selected')}</h2>
            <p className="text-gray-600">{t('please_select_package_first')}</p>
          </div>
          <button
            onClick={() => navigate('/packages')}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            {t('browse_packages')}
          </button>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('package_not_found')}</h2>
            <p className="text-gray-600">{t('selected_package_not_found')}</p>
          </div>
          <button
            onClick={() => navigate('/packages')}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            {t('browse_packages')}
          </button>
        </div>
      </div>
    );
  }

  const total = Math.max(0, packageData.sale_price - discount);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Helmet>
          <title>{t('checkout')} - eSIMFly</title>
          <meta name="description" content={t('checkout_description')} />
        </Helmet>
        
        {/* Header with back button */}
        <div className="w-full bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col md:flex-row max-w-5xl mx-auto w-full py-6 md:py-12 gap-4 md:gap-8 px-2 md:px-0">
          {/* Left: Form */}
          <div className="flex-1 flex flex-col justify-between">
            <form className="bg-white rounded-xl shadow p-6 md:p-8 flex flex-col gap-6" onSubmit={handleFormSubmit}>
              {/* Credit Card Section at the top using Stripe Elements */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900">Credit card</h2>
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    ref={paymentFormRef}
                    amount={total}
                    currency="eur"
                    email={email}
                    packageId={packageData.id}
                    name={name}
                    surname={surname}
                    phone={phone}
                    country={country}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              </div>
              {/* Billing Address Section */}
              <div>
                <h2 className="text-lg font-bold mb-2 text-gray-900">Billing address</h2>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country/Region</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select your country</option>
                    {europeanCountries.map(c => (
                      <option key={c.code} value={c.code}>{c.name.en}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="First name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                  <input type="text" value={surname} onChange={e => setSurname(e.target.value)} placeholder="Last name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg mt-4">Pay now</button>
            </form>
          </div>
          {/* Right: Order Summary */}
          <div className="w-full md:w-96 bg-white border border-gray-200 rounded-xl shadow p-6 flex flex-col">
            <div className="flex items-center mb-4">
              {(() => {
                // Try to match the country name from packageData to a country in europeanCountries
                let countryFlag = '';
                let countryName = '';
                if (packageData && packageData.country_name) {
                  const countryNameValue = typeof packageData.country_name === 'string' ? packageData.country_name : packageData.country_name.en;
                  const found = europeanCountries.find(c => c.name.en.toLowerCase() === countryNameValue.toLowerCase() || c.name.al.toLowerCase() === countryNameValue.toLowerCase());
                  if (found) {
                    countryFlag = found.flag;
                    countryName = found.name.en;
                  }
                }
                if (countryFlag) {
                  return <img src={countryFlag} alt={countryName} className="w-14 h-14 rounded object-cover border border-gray-200" />;
                } else {
                  return <img src={packageData?.image || '/images/placeholder.svg'} alt={countryName} className="w-14 h-14 rounded object-cover border border-gray-200" />;
                }
              })()}
              <div className="ml-4 flex-1">
                <div className="font-semibold text-lg">{typeof packageData.name === 'string' ? packageData.name : packageData.name[language]}</div>
                <div className="text-gray-500 text-sm">{packageData.data_amount}GB / {packageData.validity_days} {t('days')}</div>
              </div>
              <div className="font-bold text-lg">ALL {packageData.sale_price.toFixed(2)}</div>
            </div>
            <input
              type="text"
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              placeholder={t('discount_coupon') + ' (' + t('if_any') + ')'}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-300 focus:border-transparent mb-4"
              disabled={isCouponApplied}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 mb-6"
              disabled={isCouponApplied}
            >
              {isCouponApplied ? t('coupon_applied') : t('apply_coupon')}
            </button>
            <div className="flex justify-between items-center mt-2 border-t border-gray-200 pt-4">
              <span className="font-bold text-2xl">Total</span>
              <span className="font-bold text-2xl">ALL {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CheckoutPage;