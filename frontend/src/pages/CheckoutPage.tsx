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
        <div className="w-full bg-white border-b-2 border-gray-200 px-4 py-4 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors font-medium shadow-md border border-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex-1 text-center">Checkout</h1>
            <div className="w-[120px]"></div> {/* Spacer to center the title */}
          </div>
        </div>

        <div className="flex flex-1 flex-col md:flex-row max-w-5xl mx-auto w-full py-6 md:py-12 gap-6 md:gap-8 px-4 md:px-0">
          {/* Left: Form */}
          <div className="flex-1 flex flex-col justify-between">
            <form className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8 flex flex-col gap-8" onSubmit={handleFormSubmit}>
              {/* Credit Card Section at the top using Stripe Elements */}
              <div className="border-b border-gray-200 pb-6">
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
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-bold mb-4 text-gray-900 border-l-4 border-green-600 pl-4">Billing address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country/Region</label>
                    <select 
                      value={country} 
                      onChange={e => {
                        console.log('[DEBUG] Country selected:', e.target.value);
                        setCountry(e.target.value);
                      }} 
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="First name" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last name *</label>
                      <input type="text" value={surname} onChange={e => setSurname(e.target.value)} placeholder="Last name" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg border-2 border-blue-600 hover:border-blue-700 shadow-lg transition-all duration-200 transform hover:scale-105">
                Pay now
              </button>
            </form>
          </div>
          {/* Right: Order Summary */}
          <div className="w-full md:w-96 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 flex flex-col">
            <h3 className="text-xl font-bold mb-4 text-gray-900 border-b-2 border-gray-200 pb-3">Order Summary</h3>
            <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {(() => {
                // Try to match the country name from packageData to a country in europeanCountries
                let countryFlag = '';
                let countryName = '';
                
                console.log('[DEBUG] Package data:', packageData);
                console.log('[DEBUG] Package country_name:', packageData?.country_name);
                
                if (packageData && packageData.country_name) {
                  const countryNameValue = typeof packageData.country_name === 'string' 
                    ? packageData.country_name 
                    : packageData.country_name[language] || packageData.country_name.en;
                  
                  console.log('[DEBUG] Country name value:', countryNameValue);
                  
                  // Try multiple matching strategies
                  let found = europeanCountries.find(c => 
                    c.name.en.toLowerCase() === countryNameValue.toLowerCase() || 
                    c.name.al.toLowerCase() === countryNameValue.toLowerCase() ||
                    c.code.toLowerCase() === countryNameValue.toLowerCase()
                  );
                  
                  // If not found, try partial matching for common cases
                  if (!found && countryNameValue.toLowerCase().includes('europe')) {
                    found = europeanCountries.find(c => c.name.en.toLowerCase().includes('europe'));
                  }
                  
                  // If still not found, try country code matching
                  if (!found && country) {
                    found = europeanCountries.find(c => c.code.toLowerCase() === country.toLowerCase());
                  }
                  
                  console.log('[DEBUG] Found country:', found);
                  
                  if (found) {
                    countryFlag = found.flag;
                    countryName = found.name.en;
                  }
                }
                
                console.log('[DEBUG] Final flag URL:', countryFlag);
                
                if (countryFlag) {
                  return <img src={countryFlag} alt={countryName} className="w-14 h-14 rounded object-cover border border-gray-200" />;
                } else {
                  // Fallback to a generic globe icon or placeholder
                  return (
                    <div className="w-14 h-14 rounded bg-gray-200 border border-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Flag</span>
                    </div>
                  );
                }
              })()}
              <div className="ml-4 flex-1">
                <div className="font-semibold text-lg">{typeof packageData.name === 'string' ? packageData.name : packageData.name[language]}</div>
                <div className="text-gray-500 text-sm">{packageData.data_amount}GB / {packageData.validity_days} {t('days')}</div>
              </div>
              <div className="font-bold text-lg">ALL {typeof packageData.sale_price === 'number' && !isNaN(packageData.sale_price) ? packageData.sale_price.toFixed(2) : '0.00'}</div>
            </div>
            <input
              type="text"
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              placeholder={t('discount_coupon') + ' (' + t('if_any') + ')'}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors mb-3"
              disabled={isCouponApplied}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 mb-6 border-2 border-green-600 hover:border-green-700 shadow-sm"
              disabled={isCouponApplied}
            >
              {isCouponApplied ? t('coupon_applied') : t('apply_coupon')}
            </button>
            <div className="flex justify-between items-center mt-4 border-t-2 border-gray-300 pt-6 bg-gray-50 p-4 rounded-lg">
              <span className="font-bold text-xl text-gray-900">Total</span>
              <span className="font-bold text-2xl text-blue-600">€{typeof total === 'number' && !isNaN(total) ? total.toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CheckoutPage;