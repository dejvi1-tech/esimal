import HeroSection from "@/components/HeroSection";
// import FeaturedPackagesSection from "@/components/FeaturedPackagesSection";
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from '@/components/TestimonialsSection';
import TrustSection from '@/components/TrustSection';
import KudoSimSection from "@/components/KudoSimSection";
import PaymentCardsSection from "@/components/PaymentCardsSection";
import { motion } from "motion/react";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from 'react-helmet-async';
import LogoSlider from '@/components/LogoSlider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import CoverageModal from '@/components/CoverageModal';

interface MostPopularPackage {
  id: string;
  name: string;
  country_name: string;
  country_code?: string;
  data_amount: number;
  validity_days: number;
  sale_price: number;
  reseller_id?: string;
  region?: string;
}

const HomePage = () => {
  const { t, language } = useLanguage();
  const [mostPopularPackages, setMostPopularPackages] = useState<MostPopularPackage[]>([]);
  const [loadingMostPopular, setLoadingMostPopular] = useState(true);
  const [isCoverageModalOpen, setCoverageModalOpen] = useState(false);

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

  // Fetch most popular packages
  useEffect(() => {
    const fetchMostPopularPackages = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/get-section-packages?slug=most-popular`);
        if (response.ok) {
          const data = await response.json();
          setMostPopularPackages(data);
        } else {
          console.error('Failed to fetch most popular packages');
        }
      } catch (error) {
        console.error('Error fetching most popular packages:', error);
      } finally {
        setLoadingMostPopular(false);
      }
    };

    fetchMostPopularPackages();
  }, []);

  const handleOpenCoverageModal = () => {
    setCoverageModalOpen(true);
  };

  const handleCloseCoverageModal = () => {
    setCoverageModalOpen(false);
  };

  return (
    <div className="pt-16">
      <Helmet>
        <title>Home | e-SimFly</title>
      </Helmet>
      <HeroSection />

      {/* Most Popular Section */}
      <section id="most-popular-packages" className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              {t('most_popular_title')}
            </h2>
            <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
              {t('most_popular_description')}
            </h2>
            <div className="w-24 h-1 bg-white/50 mx-auto rounded-full mt-6"></div>
          </motion.div>

          {/* Most Popular Packages Grid */}
          {loadingMostPopular ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
            </div>
          ) : mostPopularPackages.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {mostPopularPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <div className="bg-slate-100/40 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col h-full">
                    <div className="flex-grow">
                      <div className="flex items-center mb-4">
                        <div className="mr-4">
                          <svg className="w-12 h-12" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="50" cy="50" r="50" fill="#4f46e5"/>
                              <g transform="translate(50,50) scale(1.5)">
                                  <path transform="rotate(0) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(30) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(60) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(90) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(120) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(150) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(180) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(210) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(240) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(270) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(300) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                                  <path transform="rotate(330) translate(0, -20)" d="M0-5L1.17 3.5H-1.17z" fill="white"/>
                              </g>
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white">{t('europe')}</h3>
                      </div>
                      <ul className="space-y-3 text-left">
                        <li className="flex items-center">
                          <div className="bg-white/20 rounded-full p-1 mr-3">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          </div>
                          <span className="text-slate-100 font-medium">
                            {pkg.data_amount === 0 ? t('unlimited_data') : `${parseFloat((pkg.data_amount / 1024).toFixed(2))} ${t('gb_internet')}`}
                          </span>
                        </li>
                        <li className="flex items-center">
                          <div className="bg-white/20 rounded-full p-1 mr-3">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          </div>
                          <span className="text-slate-100 font-medium">
                            {pkg.validity_days} {t('days')}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-transparent rounded-full p-1 mr-3 mt-1">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                          </div>
                          <button 
                            onClick={handleOpenCoverageModal}
                            className="text-left focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg bg-white/10 hover:bg-white/20 p-2 transition-colors"
                          >
                            <span className="text-slate-100 font-medium">{t('coverage_39_countries')}</span>
                            <span className="block text-slate-300 text-xs">{t('albania_usa_included')}</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                    <div className="text-center mt-6">
                      <div className="text-5xl font-extrabold text-white mb-4">
                        {pkg.sale_price.toFixed(2)} €
                      </div>
                      <Link
                        to={`/checkout?package=${pkg.id}`}
                        className="w-full inline-block"
                      >
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 text-lg rounded-xl transition-all hover:shadow-lg hover:scale-105">
                          {t('activate')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center py-12"
            >
              <p className="text-gray-700 dark:text-gray-300 text-lg">{t('no_packages_available')}</p>
            </motion.div>
          )}
        </div>
      </section>

      <CoverageModal isOpen={isCoverageModalOpen} onClose={handleCloseCoverageModal} />

      {/* eSIM Compatibility Section */}
      <section id="compatibility" className="py-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Left side: Title & Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="w-full md:w-1/2 text-center md:text-left"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 dark:text-gray-200 leading-tight mb-6">
                {t('esim_compatibility_section_title')}
              </h2>
              <div className="text-lg font-medium text-gray-600 dark:text-gray-400 space-y-2">
                <p>{t('esim_compat_subtitle')}</p>
                <p>{t('esim_compat_instructions')}</p>
              </div>
            </motion.div>
            
            {/* Right side: Compatibility Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full md:w-auto flex justify-center"
            >
              <div className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-2xl p-2 w-full max-w-md">
                <div
                  className="w-full p-4 flex flex-col items-center gap-4"
                  tabIndex={0}
                  aria-label={t('esim_compatibility_aria')}
                >
                  <img
                    src="/esim-compatibility.jpg"
                    alt={t('esim_compatibility_alt')}
                    className="rounded-xl w-full shadow-lg border border-white/20 object-contain"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 w-full justify-center mt-2">
                    <a
                      href="/support"
                      className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-center text-sm"
                      tabIndex={0}
                      aria-label={t('learn_more_aria')}
                    >
                      {t('learn_more')}
                    </a>
                    <a
                      href="/support"
                      className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-center text-sm"
                      tabIndex={0}
                      aria-label={t('see_packages_aria')}
                    >
                      {t('see_packages')}
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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