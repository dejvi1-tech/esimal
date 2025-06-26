import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { toast } from '@/hooks/use-toast';
import { Dialog } from '@headlessui/react';
import { X, Info } from 'lucide-react';
import { europeanCountries } from '@/data/countries';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

const countries = [
  'Albania', 'United States', 'Germany', 'Italy', 'France', 'United Kingdom', 'Spain', 'Greece', 'Turkey', 'Switzerland', 'Austria', 'Netherlands', 'Belgium', 'Poland', 'Romania', 'Serbia', 'Croatia', 'Bulgaria', 'Hungary', 'Czech Republic', 'Slovakia', 'Slovenia', 'Montenegro', 'Kosovo', 'North Macedonia', 'Bosnia and Herzegovina', 'Ukraine', 'Russia', 'Canada', 'Australia', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 'Singapore', 'Hong Kong', 'South Korea', 'Thailand', 'Malaysia', 'Indonesia', 'Vietnam', 'Philippines', 'Egypt', 'Morocco', 'South Africa', 'UAE', 'Saudi Arabia', 'Israel', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Jordan', 'Lebanon', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'New Zealand', 'Ireland', 'Sweden', 'Norway', 'Finland', 'Denmark', 'Estonia', 'Latvia', 'Lithuania', 'Luxembourg', 'Liechtenstein', 'Iceland', 'Malta', 'Cyprus', 'Georgia', 'Armenia', 'Azerbaijan', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Moldova', 'Belarus', 'Vatican City', 'Monaco', 'San Marino', 'Andorra', 'Gibraltar', 'Greenland', 'Faroe Islands', 'Macau', 'Taiwan', 'Macao', 'Reunion', 'Other'
];

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

const CheckoutStepper = () => (
  <div className="flex items-center justify-center gap-4 mb-8 select-none">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-blue-600">1</div>
      <span className="text-xs mt-1 text-blue-600 font-semibold">Details</span>
    </div>
    <div className="h-1 w-8 bg-blue-200 rounded" />
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-purple-600">2</div>
      <span className="text-xs mt-1 text-purple-600 font-semibold">Payment</span>
    </div>
    <div className="h-1 w-8 bg-blue-200 rounded" />
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-400 bg-gray-200">3</div>
      <span className="text-xs mt-1 text-gray-400 font-semibold">Confirmation</span>
    </div>
  </div>
);

const countryList = [
  { code: 'AL', name: 'Shqipëria', flag: 'https://flagcdn.com/al.svg' },
  { code: 'AT', name: 'Austria', flag: 'https://flagcdn.com/at.svg' },
  { code: 'BE', name: 'Belgjika', flag: 'https://flagcdn.com/be.svg' },
  { code: 'BG', name: 'Bullgaria', flag: 'https://flagcdn.com/bg.svg' },
  { code: 'HR', name: 'Kroacia', flag: 'https://flagcdn.com/hr.svg' },
  { code: 'CY', name: 'Qipro', flag: 'https://flagcdn.com/cy.svg' },
  { code: 'CZ', name: 'Çekia', flag: 'https://flagcdn.com/cz.svg' },
  { code: 'DK', name: 'Danimarka', flag: 'https://flagcdn.com/dk.svg' },
  { code: 'EE', name: 'Estonia', flag: 'https://flagcdn.com/ee.svg' },
  { code: 'FI', name: 'Finlanda', flag: 'https://flagcdn.com/fi.svg' },
  { code: 'FR', name: 'Franca', flag: 'https://flagcdn.com/fr.svg' },
  { code: 'DE', name: 'Gjermania', flag: 'https://flagcdn.com/de.svg' },
  { code: 'GR', name: 'Greqia', flag: 'https://flagcdn.com/gr.svg' },
  { code: 'HU', name: 'Hungaria', flag: 'https://flagcdn.com/hu.svg' },
  { code: 'IS', name: 'Islanda', flag: 'https://flagcdn.com/is.svg' },
  { code: 'IE', name: 'Irlanda', flag: 'https://flagcdn.com/ie.svg' },
  { code: 'IT', name: 'Italia', flag: 'https://flagcdn.com/it.svg' },
  { code: 'LV', name: 'Letonia', flag: 'https://flagcdn.com/lv.svg' },
  { code: 'LI', name: 'Lihtenshtajni', flag: 'https://flagcdn.com/li.svg' },
  { code: 'LT', name: 'Lituania', flag: 'https://flagcdn.com/lt.svg' },
  { code: 'LU', name: 'Luksemburgu', flag: 'https://flagcdn.com/lu.svg' },
  { code: 'MT', name: 'Malta', flag: 'https://flagcdn.com/mt.svg' },
  { code: 'MD', name: 'Moldavia', flag: 'https://flagcdn.com/md.svg' },
  { code: 'MC', name: 'Monako', flag: 'https://flagcdn.com/mc.svg' },
  { code: 'ME', name: 'Mali i Zi', flag: 'https://flagcdn.com/me.svg' },
  { code: 'NL', name: 'Holanda', flag: 'https://flagcdn.com/nl.svg' },
  { code: 'MK', name: 'Maqedonia e Veriut', flag: 'https://flagcdn.com/mk.svg' },
  { code: 'NO', name: 'Norvegjia', flag: 'https://flagcdn.com/no.svg' },
  { code: 'PL', name: 'Polonia', flag: 'https://flagcdn.com/pl.svg' },
  { code: 'PT', name: 'Portugalia', flag: 'https://flagcdn.com/pt.svg' },
  { code: 'RO', name: 'Rumania', flag: 'https://flagcdn.com/ro.svg' },
  { code: 'RU', name: 'Rusia', flag: 'https://flagcdn.com/ru.svg' },
  { code: 'SM', name: 'San Marino', flag: 'https://flagcdn.com/sm.svg' },
  { code: 'RS', name: 'Serbia', flag: 'https://flagcdn.com/rs.svg' },
  { code: 'SK', name: 'Sllovakia', flag: 'https://flagcdn.com/sk.svg' },
  { code: 'SI', name: 'Sllovenia', flag: 'https://flagcdn.com/si.svg' },
  { code: 'ES', name: 'Spanja', flag: 'https://flagcdn.com/es.svg' },
  { code: 'SE', name: 'Suedia', flag: 'https://flagcdn.com/se.svg' },
  { code: 'CH', name: 'Zvicra', flag: 'https://flagcdn.com/ch.svg' },
  { code: 'TR', name: 'Turqia', flag: 'https://flagcdn.com/tr.svg' },
  { code: 'UA', name: 'Ukraina', flag: 'https://flagcdn.com/ua.svg' },
  { code: 'GB', name: 'Mbretëria e Bashkuar', flag: 'https://flagcdn.com/gb.svg' },
  { code: 'VA', name: 'Vatikani', flag: 'https://flagcdn.com/va.svg' },
  // Add more if needed
];

interface PackageData {
  id: string;
  name: { al: string; en: string } | string;
  sale_price: number;
  data_amount: number;
  validity_days: number;
  country_name: { al: string; en: string } | string;
}

const CheckoutForm: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [country, setCountry] = useState('Albania');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryList[0]);
  const [search, setSearch] = useState('');
  const [compatModalOpen, setCompatModalOpen] = useState(false);
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Get package ID from URL params
  const packageId = searchParams.get('packageId');

  // Fetch package data on component mount
  useEffect(() => {
    if (packageId) {
      fetchPackageData();
    }
  }, [packageId, language]);

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
      console.error('Error fetching package:', error);
      toast({
        title: t('error'),
        description: t('failed_to_load_package_details'),
        variant: 'destructive',
      });
    }
  };

  const createPaymentIntent = async () => {
    if (!packageData || !email || !name || !surname) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stripe/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: packageData.id,
          userEmail: email,
          userName: `${name} ${surname}`,
          userId: null, // Guest user
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data.clientSecret;
      } else {
        throw new Error(result.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // Create payment intent if we don't have one
      if (!clientSecret) {
        const newClientSecret = await createPaymentIntent();
        if (!newClientSecret) {
          setIsProcessing(false);
          return;
        }
        setClientSecret(newClientSecret);
      }

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret!, {
        payment_method: {
          card: elements.getElement(CardNumberElement)!,
          billing_details: {
            name: `${name} ${surname}`,
            email: email,
          },
        },
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message || 'There was an error processing your payment.',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: 'Payment Successful',
          description: 'Your payment was processed successfully!',
        });
        navigate('/?success=true');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: 'Payment Error',
        description: 'There was an error processing your payment.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCountries = countryList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!packageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | e-SimFly</title>
      </Helmet>
      <CheckoutStepper />
      <motion.form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6 mt-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Package Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-2">{t('order_summary')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t('package')}:</span>
              <span className="font-medium">{typeof packageData.name === 'string' ? packageData.name : packageData.name[language]}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('data')}:</span>
              <span className="font-medium">{(packageData.data_amount / 1024) % 1 === 0 ? (packageData.data_amount / 1024) : (packageData.data_amount / 1024).toFixed(2)}GB</span>
            </div>
            <div className="flex justify-between">
              <span>{t('validity')}:</span>
              <span className="font-medium">{packageData.validity_days} {t('days')}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">{t('total')}:</span>
              <span className="font-bold text-lg">${packageData.sale_price}</span>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email_address')}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
              placeholder={t('email_address')} 
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('first_name')}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
                placeholder={t('first_name')} 
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('last_name')}</label>
              <input 
                type="text" 
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
                placeholder={t('last_name')} 
                required
              />
            </div>
          </div>
        </div>

        {/* Card Fields */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-6 text-gray-900">Payment Details</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <div className="relative flex items-center border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all" style={{height: 52}}>
                <CardNumberElement
                  options={{ style: stripeInputStyle, placeholder: '1234 1234 1234 1234' }}
                  className="flex-1 bg-transparent outline-none text-lg"
                />
                <span className="ml-2 flex gap-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-5 w-8 object-contain" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="Mastercard" className="h-5 w-8 object-contain" />
                </span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                <div className="border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all flex items-center" style={{height: 52}}>
                  <CardExpiryElement
                    options={{ style: stripeInputStyle, placeholder: 'MM / YY' }}
                    className="bg-transparent outline-none w-full text-lg"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">CVC
                  <span className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-32 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none z-20">3 digits on back of card</span>
                  </span>
                </label>
                <div className="border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all flex items-center" style={{height: 52}}>
                  <CardCvcElement
                    options={{ style: stripeInputStyle, placeholder: 'CVC' }}
                    className="bg-transparent outline-none w-full text-lg"
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
          {isProcessing ? 'Processing...' : `Pay $${packageData.sale_price}`}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By completing your purchase, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.form>
    </>
  );
};

const CheckoutPageContent: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [compatModalOpen, setCompatModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countryList[0]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchParams] = useSearchParams();
  // Add state for form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [loading, setLoading] = useState(false);
  const [packageData, setPackageData] = useState<any>(null);
  const [packageLoading, setPackageLoading] = useState(true);
  const [packageError, setPackageError] = useState('');

  // Get country and package from URL
  const countryCode = searchParams.get('country');
  const packageId = searchParams.get('package');

  // Fetch package data from backend
  useEffect(() => {
    const fetchPackageData = async () => {
      if (!packageId) {
        setPackageError('No package ID provided');
        setPackageLoading(false);
        return;
      }

      try {
        setPackageLoading(true);
        setPackageError('');
        
        // First try to get the package from the backend API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/frontend-packages`);
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        
        const packages = await response.json();
        const foundPackage = packages.find((pkg: any) => pkg.id === packageId);
        
        if (foundPackage) {
          setPackageData(foundPackage);
        } else {
          // If not found in backend, try to find a similar package
          console.warn(`Package ${packageId} not found in backend, trying to find similar package`);
          
          // Try to find a package with similar characteristics
          const similarPackage = packages.find((pkg: any) => 
            pkg.data_amount === 1024 && pkg.validity_days === 30 // Default to 1GB 30 days
          );
          
          if (similarPackage) {
            setPackageData(similarPackage);
            console.log('Using similar package:', similarPackage);
          } else {
            setPackageError('Package not found');
          }
        }
      } catch (error) {
        console.error('Error fetching package:', error);
        setPackageError('Failed to load package data');
      } finally {
        setPackageLoading(false);
      }
    };

    fetchPackageData();
  }, [packageId]);

  // Fallback to static data for display purposes
  const EU_FLAG = 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg';
  const isEU = countryCode === 'EU';
  const countryObj = isEU ? { flag: EU_FLAG, name: { al: 'Europë', en: 'Europe' }, code: 'EU', packages: [] } : europeanCountries.find(c => c.code === countryCode) || europeanCountries[0];
  const staticPackageObj = (!isEU ? countryObj.packages.find(p => p.id === packageId) : europeanCountries[0].packages.find(p => p.id === packageId)) || europeanCountries[0].packages[0];

  const filteredCountries = countryList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Stripe Checkout handler
  const handleStripeCheckout = async () => {
    // Validate required fields
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!surname.trim()) {
      alert('Please enter your surname');
      return;
    }
    
    // Validate package data
    if (!packageData) {
      alert('Package data not available. Please try again.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: packageData.id,
          email: email.trim(),
          name: name.trim(),
          surname: surname.trim(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Stripe checkout error:', response.status, errorData);
        alert(`Failed to start payment: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Stripe checkout response:', data);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No URL in response:', data);
        alert('Failed to start payment: No checkout URL received');
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      alert('Failed to start payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen checkout-bg py-10 mt-[8rem]">
      {/* Main content: two columns */}
      <div className="max-w-5xl mx-auto bg-white/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden space-y-6 md:space-y-0 md:space-x-6 px-2 md:px-0">
        {/* Left column: user info */}
        <div className="flex-1 p-4 sm:p-8 w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('your_info')}</h2>
          <form className="space-y-6" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email_address')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring" placeholder={t('email_address')} required />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('first_name')}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring" placeholder={t('first_name')} required />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('last_name')}</label>
                <input type="text" value={surname} onChange={e => setSurname(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring" placeholder={t('last_name')} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone_number')}</label>
              <input type="tel" className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring" placeholder={t('phone_number_placeholder')} />
            </div>
            {/* Payment method option - after mobile number */}
            <div className="flex items-center justify-between mt-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#635BFF]">
                  <span className="w-3 h-3 bg-white rounded-full block"></span>
                </span>
                <span className="text-lg font-medium text-gray-900">{t('pay_with_card')} <span className="font-normal text-gray-700">({t('all_banks')})</span></span>
              </div>
              <span className="flex gap-1 ml-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-6 w-10 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="Mastercard" className="h-6 w-10 object-contain" />
              </span>
            </div>
          </form>
        </div>
        {/* Right column: order summary and payment info (unchanged) */}
        <div className="w-full md:w-96 bg-white/30 backdrop-blur-md border border-white/20 border-l p-4 sm:p-8 flex flex-col items-center mb-6 md:mb-0">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Porosia juaj</h2>
          <img src={countryObj.flag} alt="flag" className="w-16 h-16 rounded-full mb-4 mx-auto" />
          <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-xl shadow p-6 w-full">
            {packageLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading package...</span>
              </div>
            ) : packageError ? (
              <div className="text-center py-8">
                <div className="text-red-600 font-semibold mb-2">Error loading package</div>
                <div className="text-sm text-gray-500">{packageError}</div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Try Again
                </button>
              </div>
            ) : packageData ? (
              <>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="font-semibold text-lg">{(packageData.data_amount / 1024) % 1 === 0 ? (packageData.data_amount / 1024) : (packageData.data_amount / 1024).toFixed(2)}GB</div>
                  <div className="text-sm text-gray-500">{packageData.validity_days} days</div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">€{packageData.sale_price}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="font-bold text-lg">€{packageData.sale_price}</span>
                </div>
                <button type="button" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold text-lg mb-2" onClick={handleStripeCheckout} disabled={loading}>
                  {loading ? 'Duke u hapur...' : `Paguaj €${packageData.sale_price}`}
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="font-semibold text-lg">{staticPackageObj.data}{staticPackageObj.bonusData ? `+${staticPackageObj.bonusData}` : ''}</div>
                  <div className="text-sm text-gray-500">{staticPackageObj.validity}/{isEU ? 'Europë' : 'Europë'}</div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{staticPackageObj.price}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="font-bold text-lg">{staticPackageObj.price}</span>
                </div>
                <button type="button" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold text-lg mb-2" onClick={handleStripeCheckout} disabled={loading}>
                  {loading ? 'Duke u hapur...' : `Paguaj ${staticPackageObj.price}`}
                </button>
              </>
            )}
            <div className="text-xs text-red-600 font-semibold mt-2">
            S'ka rëndësi nga cila bankë e ke kartelën – nëse është Visa apo MasterCard, ne e pranojmë! Pagesa e sigurt dhe pa pengesa.
            </div>
          </div>
        </div>
      </div>
      {/* Supported countries modal (view only) */}
      <Dialog open={countryModalOpen} onClose={() => setCountryModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-4 sm:p-6 z-10">
            <button onClick={() => setCountryModalOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" aria-label="Mbyll">
              <X className="w-6 h-6" />
            </button>
            <Dialog.Title className="text-lg font-bold mb-4">Shtetet e mbështetura</Dialog.Title>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredCountries.map(c => (
                <div key={c.code} className="flex items-center gap-2 w-full px-3 py-2 rounded">
                  <img src={c.flag} alt={c.name} className="w-6 h-6 rounded-full" />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
      {/* Device compatibility modal */}
      <Dialog open={compatModalOpen} onClose={() => setCompatModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-4 sm:p-6 z-10 flex flex-col items-center">
            <button onClick={() => setCompatModalOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" aria-label="Mbyll">
              <X className="w-6 h-6" />
            </button>
            <img src="/esim-compatibility-check.jpg" alt="eSIM Compatibility" className="w-full max-w-md rounded-lg" />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

// Remove the duplicate components and internal Routes
// Just export the CheckoutPageContent wrapped in Elements

const CheckoutPage: React.FC = () => (
  <Elements stripe={stripePromise}>
    <CheckoutPageContent />
  </Elements>
);

export default CheckoutPage;