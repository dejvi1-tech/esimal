import React, { useState } from 'react';
import { useNavigate, useSearchParams, Route, Routes } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
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

const CheckoutForm: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [country, setCountry] = useState('Albania');
  const [email, setEmail] = useState(user?.email || '');
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryList[0]);
  const [search, setSearch] = useState('');
  const [compatModalOpen, setCompatModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    try {
      // Simulate payment for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Payment Successful',
        description: 'Your payment was processed successfully!',
      });
      navigate('/?success=true');
    } catch (err) {
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCountries = countryList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Card Fields */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-6 text-gray-900">Payment Details</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Name on Card" />
            </div>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            value={country}
            onChange={e => setCountry(e.target.value)}
          >
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3 px-4 rounded-md text-white font-semibold bg-[#635BFF] hover:bg-[#4F3CD9] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF] disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
        >
          {isProcessing && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          )}
          {isProcessing ? 'Processing...' : 'Pay'}
        </button>
      </motion.form>
    </>
  );
};

const CheckoutPageContent: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [compatModalOpen, setCompatModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countryList[0]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchParams] = useSearchParams();

  // Get country and package from URL
  const countryCode = searchParams.get('country');
  const packageId = searchParams.get('package');

  // Find country and package objects
  const EU_FLAG = 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg';
  const isEU = countryCode === 'EU';
  const countryObj = isEU ? { flag: EU_FLAG, name: { al: 'Europë', en: 'Europe' }, code: 'EU', packages: [] } : europeanCountries.find(c => c.code === countryCode) || europeanCountries[0];
  const packageObj = (!isEU ? countryObj.packages.find(p => p.id === packageId) : europeanCountries[0].packages.find(p => p.id === packageId)) || europeanCountries[0].packages[0];

  const filteredCountries = countryList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      {/* Top dropdown buttons */}
      <div className="flex flex-col md:flex-row gap-4 max-w-5xl mx-auto mb-8 mt-8">
        <button
          className="flex items-center bg-gray-200 rounded-2xl px-8 py-4 text-lg font-semibold text-gray-800 shadow-sm relative min-w-[320px] w-full md:w-auto justify-center"
          style={{ minHeight: 64 }}
          onClick={() => setCountryModalOpen(true)}
        >
          <span className="flex -space-x-4 mr-3">
            <img src={countryObj.flag} alt="flag" className="w-8 h-8 rounded-full border-2 border-white z-30" />
            <img src="https://flagcdn.com/be.svg" alt="flag2" className="w-8 h-8 rounded-full border-2 border-white z-20" />
            <img src="https://flagcdn.com/al.svg" alt="flag3" className="w-8 h-8 rounded-full border-2 border-white z-10" />
          </span>
          Lista e shteteve (43)
          <svg className="ml-2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button
          className="bg-gray-200 rounded-2xl px-8 py-4 text-lg font-semibold text-gray-800 shadow-sm min-w-[320px] w-full md:w-auto flex items-center justify-center"
          style={{ minHeight: 64 }}
          onClick={() => setCompatModalOpen(true)}
        >
          Kontrollo nëse pajisja juaj është e përshtatshme
        </button>
      </div>
      {/* Main content: two columns */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden space-y-6 md:space-y-0 md:space-x-6 px-2 md:px-0">
        {/* Left column: user info */}
        <div className="flex-1 p-4 sm:p-8 w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Informatat tuaja</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring" placeholder="Email address" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Emri</label>
                <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring" placeholder="Emri" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mbiemri</label>
                <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring" placeholder="Mbiemri" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numri i telefonit (04x xxx xxx)</label>
              <input type="tel" className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring" placeholder="Numri i telefonit (04x xxx xxx)" />
            </div>
            {/* Payment method option - after mobile number */}
            <div className="flex items-center justify-between mt-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#635BFF]">
                  <span className="w-3 h-3 bg-white rounded-full block"></span>
                </span>
                <span className="text-lg font-medium text-gray-900">Pagesë me kartelë online <span className="font-normal text-gray-700">(Të gjitha bankat)</span></span>
              </div>
              <span className="flex gap-1 ml-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-6 w-10 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="Mastercard" className="h-6 w-10 object-contain" />
              </span>
            </div>
          </form>
        </div>
        {/* Right column: order summary and payment info (unchanged) */}
        <div className="w-full md:w-96 bg-gray-50 border-l border-gray-200 p-4 sm:p-8 flex flex-col items-center mb-6 md:mb-0">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Porosia juaj</h2>
          <img src={countryObj.flag} alt="flag" className="w-16 h-16 rounded-full mb-4 mx-auto" />
          <div className="bg-white rounded-xl shadow p-6 w-full">
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="font-semibold text-lg">{packageObj.data}{packageObj.bonusData ? `+${packageObj.bonusData}` : ''}</div>
              <div className="text-sm text-gray-500">{packageObj.validity}/{isEU ? 'Europë' : 'Europë'}</div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">{packageObj.price}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="font-bold text-lg">{packageObj.price}</span>
            </div>
            <button type="button" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold text-lg mb-2" onClick={() => navigate('/checkout/payment')}>Paguaj {packageObj.price}</button>
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

// New: CheckoutPaymentPage for card entry
const CheckoutPaymentPage: React.FC = () => {
  // You can reuse most of the payment logic from CheckoutForm
  // For demo, just show the card fields and a summary
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <CheckoutStepper />
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Detajet e Pagesës</h2>
        {/* Card Fields */}
        <div className="space-y-5 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emri në Kartë</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Name on Card" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numri i Kartës</label>
            <div className="relative flex items-center border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all" style={{height: 52}}>
              <CardNumberElement options={{ style: stripeInputStyle, placeholder: '1234 1234 1234 1234' }} className="flex-1 bg-transparent outline-none text-lg" />
              <span className="ml-2 flex gap-1">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-5 w-8 object-contain" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="Mastercard" className="h-5 w-8 object-contain" />
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data e Skadimit</label>
              <div className="border border-gray-300 rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 transition-all flex items-center" style={{height: 52}}>
                <CardExpiryElement options={{ style: stripeInputStyle, placeholder: 'MM / YY' }} className="bg-transparent outline-none w-full text-lg" />
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
                <CardCvcElement options={{ style: stripeInputStyle, placeholder: 'CVC' }} className="bg-transparent outline-none w-full text-lg" />
              </div>
            </div>
          </div>
        </div>
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold text-lg mb-2">Paguaj</button>
      </div>
    </div>
  );
};

// Add a route for /checkout/payment
// In the main export, wrap CheckoutPageContent and CheckoutPaymentPage in <Routes>
const CheckoutPage: React.FC = () => (
  <Elements stripe={stripePromise}>
    <Routes>
      <Route path="/checkout/payment" element={<CheckoutPaymentPage />} />
      <Route path="*" element={<CheckoutPageContent />} />
    </Routes>
  </Elements>
);

export default CheckoutPage;