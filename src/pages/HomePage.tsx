import HeroSection from "@/components/HeroSection";
import CountryPackagesSection from "@/components/CountryPackagesSection";
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from '@/components/TestimonialsSection';
import TrustSection from '@/components/TrustSection';
import KudoSimSection from "@/components/KudoSimSection";
import PaymentCardsSection from "@/components/PaymentCardsSection";
import { motion } from "motion/react";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import LogoSlider from '@/components/LogoSlider';

const dummyRecentlyViewed = [
  { id: 1, name: 'USA e-Sim', country: 'United States', price: 29.99 },
  { id: 2, name: 'Europe e-Sim', country: 'Europe', price: 39.99 },
  { id: 3, name: 'Japan e-Sim', country: 'Japan', price: 24.99 },
];

const HomePage = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Operator logos - place your logo files in public/static/operators/
  const logos = [
    { src: '/static/operators/vodafone.png', alt: 'Vodafone' },
    { src: '/static/operators/orange.png', alt: 'Orange' },
    { src: '/static/operators/t-mobile.png', alt: 'T-Mobile' },
    { src: '/static/operators/three.png', alt: 'Three' },
    { src: '/static/operators/ee.png', alt: 'EE' },
    { src: '/static/operators/o2.png', alt: 'O2' },
    { src: '/static/operators/verizon.png', alt: 'Verizon' },
    { src: '/static/operators/att.png', alt: 'AT&T' }
  ];

  return (
    <div className="pt-16">
      <Helmet>
        <title>Home | e-SimFly</title>
      </Helmet>
      <HeroSection />
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 py-6 mt-6 bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome, {user.email}!</h2>
          <p className="text-gray-600 mb-6">Here are your recently viewed e-Sims.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dummyRecentlyViewed.map((item) => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:shadow transition-shadow">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-600">Country: {item.country}</p>
                <p className="text-sm text-gray-600">Price: ${item.price}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      <div id="package-cards-section">
        <CountryPackagesSection />
      </div>

      {/* eSIM Compatibility Card - only on HomePage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="flex justify-center mb-16"
      >
        <div className="bg-white dark:bg-white rounded-2xl p-2 w-full flex justify-center">
          <motion.div
            whileHover={{ y: -6, boxShadow: '0 8px 32px 0 rgba(80, 36, 180, 0.12)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="bg-white/90 rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full p-6 md:p-10 flex flex-col items-center gap-6 focus-within:ring-2 focus-within:ring-purple-400"
            tabIndex={0}
            aria-label={t('esim_compatibility_aria')}
          >
            <img
              src="/esim-compatibility.jpg"
              alt={t('esim_compatibility_alt')}
              className="rounded-2xl w-full max-w-lg md:max-w-2xl shadow-2xl border-2 border-blue-200 object-contain transition-transform duration-300 hover:scale-105 hover:shadow-blue-400/40"
              style={{ boxShadow: '0 0 32px 4px rgba(80, 36, 180, 0.10), 0 8px 32px 0 rgba(80, 36, 180, 0.12)' }}
            />
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">
                {t('esim_compatibility_title_1')} <span className="text-purple-700 font-extrabold">*#06#</span> {t('esim_compatibility_title_2')}
              </h3>
              <p className="text-gray-700 text-base md:text-lg">
                {t('esim_compatibility_desc_1')} <span className="font-semibold text-blue-700">[EID]</span> {t('esim_compatibility_desc_2')}
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full justify-center mt-2">
              <a
                href="/support"
                className="inline-block px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-center"
                tabIndex={0}
                aria-label={t('learn_more_aria')}
              >
                {t('learn_more')}
              </a>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('package-cards-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-block px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-center"
                tabIndex={0}
                aria-label={t('see_packages_aria')}
              >
                {t('see_packages')}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <PaymentCardsSection />
      <KudoSimSection />
      <LogoSlider logos={logos} />
      <TestimonialsSection />
      <TrustSection />
      <FAQSection />
    </div>
  );
};

export default HomePage;