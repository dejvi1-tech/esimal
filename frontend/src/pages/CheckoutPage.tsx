import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { toast } from '@/hooks/use-toast';
import { Dialog } from '@headlessui/react';
import { X, Info } from 'lucide-react';
import { PaymentForm } from '@/components/PaymentForm';

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
  const [country, setCountry] = useState('Albania');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryList[0]);
  const [search, setSearch] = useState('');
  const [compatModalOpen, setCompatModalOpen] = useState(false);
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

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

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment successful:', paymentIntentId);
    navigate('/checkout/success?payment_intent_id=' + paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: t('payment_failed'),
      description: error,
      variant: 'destructive',
    });
  };

  const handleContinueToPayment = () => {
    if (!email.trim()) {
      toast({
        title: t('missing_email'),
        description: t('please_enter_email'),
        variant: 'destructive',
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: t('missing_name'),
        description: t('please_enter_name'),
        variant: 'destructive',
      });
      return;
    }
    if (!surname.trim()) {
      toast({
        title: t('missing_surname'),
        description: t('please_enter_surname'),
        variant: 'destructive',
      });
      return;
    }
    setShowPaymentForm(true);
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

  if (showPaymentForm) {
    return (
      <Elements stripe={stripePromise}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <CheckoutStepper />
          <PaymentForm
            amount={packageData.sale_price}
            currency="eur"
            email={email}
            packageId={packageData.id}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </Elements>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('checkout')} - eSIMFly</title>
        <meta name="description" content={t('checkout_description')} />
      </Helmet>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-4 py-8"
      >
        <CheckoutStepper />

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-6 text-gray-900">{t('personal_details')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('first_name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('enter_first_name')}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('last_name')} *
              </label>
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('enter_last_name')}
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')} *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('enter_email')}
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-6 text-gray-900">{t('order_summary')}</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">
                {typeof packageData.name === 'string' ? packageData.name : packageData.name[language]}
              </h4>
              <p className="text-sm text-gray-600">
                {packageData.data_amount}GB • {packageData.validity_days} {t('days')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-gray-900">€{packageData.sale_price}</p>
            </div>
          </div>
          
          <hr className="my-4" />
          
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">{t('total')}</span>
            <span className="font-bold text-xl text-gray-900">€{packageData.sale_price}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinueToPayment}
          className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
        >
          {t('continue_to_payment')}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          {t('payment_terms_notice')}
        </p>
      </motion.form>
    </>
  );
};

const CheckoutPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <CheckoutForm />
  </div>
);

export default CheckoutPage;