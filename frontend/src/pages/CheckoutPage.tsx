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
import { formatDataAmount } from '@/utils/formatDataAmount';

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
  days: number;
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
  const { t, language, setLanguage } = useLanguage();
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
  console.log('[DEBUG] Available countries:', europeanCountries.length, europeanCountries.map(c => c.name.en));

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

  useEffect(() => {
    if (language !== 'al') setLanguage('al');
  }, [language, setLanguage]);

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
      <div className="checkout-page min-h-screen bg-gray-50 flex flex-col">
        <Helmet>
          <title>{t('checkout')} - eSIMFly</title>
          <meta name="description" content={t('checkout_description')} />
        </Helmet>
        
        {/* Header with back button */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-white to-purple-50 border-b-2 border-gray-200 px-4 py-4 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 border-2 border-blue-500 text-blue-700 bg-white hover:bg-blue-50 hover:text-blue-900 rounded-lg transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex-1 text-center">Checkout</h1>
            <div className="w-[120px]"></div> {/* Spacer to center the title */}
          </div>
        </div>

        <div className="flex-1 w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-8">
          <div className="flex flex-1 flex-col md:flex-row max-w-5xl mx-auto w-full py-6 md:py-12 gap-6 md:gap-8 px-4 md:px-0">
            {/* Left: Form */}
            <div className="flex-1 flex flex-col justify-between">
              <form className="bg-white/90 rounded-2xl shadow-2xl border border-blue-100 p-6 md:p-10 flex flex-col gap-8" onSubmit={handleFormSubmit} style={{boxShadow: '0 8px 32px rgba(80,80,180,0.08)'}}>
                {/* Credit Card Section at the top using Stripe Elements */}
                <div className="border-b border-blue-100 pb-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 border-l-4 border-blue-600 pl-4">Credit card</h2>
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
                <div className="border-b border-blue-100 pb-6">
                  <h2 className="text-lg font-bold mb-4 text-gray-900 border-l-4 border-green-600 pl-4">Billing address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border-2 border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white/80"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country/Region</label>
                      <select 
                        value={country} 
                        onChange={e => setCountry(e.target.value)} 
                        className="w-full px-4 py-3 border-2 border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white/80"
                      >
                        <option value="">Select your country</option>
                        {europeanCountries.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.name.en} {c.code === 'AL' ? '(Albania)' : ''} - {c.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First name *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="First name" className="w-full px-4 py-3 border-2 border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white/80" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last name *</label>
                        <input type="text" value={surname} onChange={e => setSurname(e.target.value)} placeholder="Last name" className="w-full px-4 py-3 border-2 border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white/80" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full px-4 py-3 border-2 border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white/80" required />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg border-2 border-blue-600 hover:border-purple-700 shadow-lg transition-all duration-200 transform hover:scale-105">
                  Pay now
                </button>
              </form>
            </div>
            {/* Right: Order Summary */}
            <div className="w-full md:w-96 bg-white/90 border-2 border-blue-100 rounded-2xl shadow-2xl p-6 flex flex-col justify-center items-center" style={{boxShadow: '0 8px 32px rgba(80,80,180,0.08)'}}>
              <h3 className="text-xl font-bold mb-4 text-gray-900 border-b-2 border-blue-100 pb-3 w-full text-center">Përmbledhje Porosie</h3>
              
              {/* Package Summary */}
              <div className="w-full mb-6">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">Package:</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDataAmount(packageData.data_amount)} - {packageData.days} days - {
                      typeof packageData.country_name === 'object' 
                        ? packageData.country_name.en 
                        : packageData.country_name
                    }
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center w-full">
                <span className="font-bold text-xl text-gray-900 mb-2">Totali</span>
                <span className="font-bold text-3xl text-blue-600">€{typeof total === 'number' && !isNaN(total) ? total.toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CheckoutPage;