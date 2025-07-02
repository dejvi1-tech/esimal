import HeroSection from "@/components/HeroSection";
// import FeaturedPackagesSection from "@/components/FeaturedPackagesSection";
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from '@/components/TestimonialsSection';
import TrustSection from '@/components/TrustSection';
import KudoSimSection from "@/components/KudoSimSection";
import PaymentCardsSection from "@/components/PaymentCardsSection";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from 'react-helmet-async';
import LogoSlider from '@/components/LogoSlider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import CoverageModal from '@/components/CoverageModal';
import { europeCoverage } from '@/data/coverageData';

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
  const { t } = useLanguage();
  const [mostPopularPackages, setMostPopularPackages] = useState<MostPopularPackage[]>([]);
  const [loadingMostPopular, setLoadingMostPopular] = useState(true);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);

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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/packages/get-section-packages?slug=most-popular`);
        if (response.ok) {
          const data = await response.json();
          setMostPopularPackages(data); // Show all packages
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
    setIsCoverageModalOpen(true);
  };

  const handleCloseCoverageModal = () => {
    setIsCoverageModalOpen(false);
  };

  // Prepare coverage data for the modal
  const coverageData = {
    countries: europeCoverage.map(c => c.country),
    regions: ['Europe', 'North America'],
    data: 'Unlimited',
    validity: '30 Days',
    speed: '5G/LTE'
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Home | e-SimFly</title>
      </Helmet>
      <HeroSection />

      {/* Most Popular Section */}
      <section id="most-popular-packages" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('most_popular_title')}
            </h2>
            <h2 className="text-lg font-medium text-gray-200 mt-4 max-w-2xl mx-auto">
              {t('most_popular_description')}
            </h2>
            <div className="w-24 h-1 bg-white/50 mx-auto rounded-full mt-6"></div>
          </div>

          {/* Most Popular Packages Grid */}
          {loadingMostPopular ? (
            <div className="flex justify-center items-center py-12">
              <div className="rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
            </div>
          ) : mostPopularPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mostPopularPackages.map((pkg, index) => (
                <div key={pkg.id}>
                  <div className="card-glass flex flex-col h-full">
                    <div className="flex-grow">
                      <div className="flex items-center mb-4">
                        <div className="mr-4">
                          {/* EU Flag in Circle */}
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 bg-white flex items-center justify-center">
                            <img 
                              src="/images/eu.png" 
                              alt="EU Flag" 
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                console.log('EU flag failed to load, using fallback');
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 810 540'%3E%3Crect width='810' height='540' fill='%23003399'/%3E%3Cg fill='%23ffcc00'%3E%3Cg transform='translate(405,270)'%3E%3Cpath transform='rotate(0) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(30) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(60) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(90) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(120) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(150) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(180) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(210) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(240) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(270) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(300) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3Cpath transform='rotate(330) translate(0,-120)' d='M0-20L5.85-6.18L19.1-6.18L9.27,3.82L15.12,17.64L0,7.64L-15.12,17.64L-9.27,3.82L-19.1-6.18L-5.85-6.18z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";
                              }}
                            />
                          </div>
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
                          <span className="text-white font-medium">
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
                          <span className="text-white font-medium">
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
                            className="text-left focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg bg-white/10 p-2"
                          >
                            <span className="text-white font-medium">{t('coverage_39_countries')}</span>
                            <span className="block text-gray-300 text-xs">{t('albania_usa_included')}</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                    <div className="text-center mt-6">
                      <div className="text-5xl font-extrabold text-white mb-4">
                        €{pkg.sale_price}
                      </div>
                      <Link to={`/checkout?country=EU&package=${pkg.id}`}>
                        <Button className="btn-glass bg-accent text-accent-foreground font-semibold w-full">
                          {t('buy_now')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white">{t('no_packages_available')}</p>
            </div>
          )}
        </div>
      </section>

      {/* eSIM Compatibility Section */}
      <section id="compatibility" className="py-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Left side: Title & Text */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 dark:text-gray-200 leading-tight mb-6">
                {t('esim_compatibility_section_title')}
              </h2>
              <div className="text-lg font-medium text-gray-600 dark:text-gray-400 space-y-2">
                <p>{t('esim_compat_subtitle')}</p>
                <p>{t('esim_compat_instructions')}</p>
              </div>
            </div>
            
            {/* Right side: Compatibility Card */}
            <div className="w-full md:w-auto flex justify-center">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PaymentCardsSection />
      <KudoSimSection />
      <LogoSlider logos={logos} />
      <TestimonialsSection />
      <TrustSection />
      <FAQSection />

      {/* Coverage Modal */}
      <CoverageModal 
        isOpen={isCoverageModalOpen} 
        onClose={handleCloseCoverageModal}
        coverage={coverageData}
      />
    </div>
  );
};

export default HomePage;