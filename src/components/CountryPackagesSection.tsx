import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wifi, Clock, Globe } from 'lucide-react';
import CountrySearch from '@/components/CountrySearch';
import { Country, Package } from '@/data/countries';
import { useLanguage } from '@/contexts/LanguageContext';
import PackageCard from '@/components/PackageCard';

// New vibrant, playful shapes
const shapes = [
  // Circles
  { type: 'circle', className: 'bg-pink-500', style: { width: 80, height: 80, borderRadius: '50%', top: 30, left: 60, opacity: 0.18 }, speed: 0.18 },
  { type: 'circle', className: 'bg-yellow-400', style: { width: 40, height: 40, borderRadius: '50%', top: 160, right: 100, opacity: 0.22 }, speed: 0.32 },
  { type: 'circle', className: 'bg-blue-500', style: { width: 60, height: 60, borderRadius: '50%', bottom: 120, left: 100, opacity: 0.15 }, speed: 0.25 },
  // Squares
  { type: 'square', className: 'bg-purple-500', style: { width: 48, height: 48, borderRadius: '16%', top: 220, right: 60, opacity: 0.16 }, speed: 0.22 },
  { type: 'square', className: 'bg-green-400', style: { width: 32, height: 32, borderRadius: '10%', bottom: 60, right: 160, opacity: 0.19 }, speed: 0.29 },
  // Triangles (using clip-path)
  { type: 'triangle', className: 'bg-orange-400', style: { width: 54, height: 54, top: 80, left: 220, opacity: 0.21 }, speed: 0.27 },
  { type: 'triangle', className: 'bg-cyan-400', style: { width: 36, height: 36, bottom: 180, right: 80, opacity: 0.18 }, speed: 0.34 },
];

const CountryPackagesSection: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const forceOpenSearch = params.get('openSearch') === '1';
  const { language, t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const offset = window.scrollY + rect.top;
      setScrollY(window.scrollY - offset);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBuyNow = (packageItem: Package) => {
    if (selectedCountry) {
      navigate(`/checkout?country=${selectedCountry.code}&package=${packageItem.id}`);
    }
  };

  return (
    <section ref={sectionRef} id="country-packages" className="relative overflow-hidden py-20 bg-gradient-to-br from-yellow-50 to-purple-50" data-id="qvalnghlf" data-path="src/components/CountryPackagesSection.tsx">
      {/* Playful Parallax Shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Circles */}
        <div className="absolute bg-pink-300 opacity-20 rounded-full" style={{ width: 120, height: 120, top: 40, left: 60 }} />
        <div className="absolute bg-yellow-200 opacity-25 rounded-full" style={{ width: 60, height: 60, top: 180, right: 100 }} />
        <div className="absolute bg-blue-300 opacity-15 rounded-full" style={{ width: 90, height: 90, bottom: 120, left: 120 }} />
        {/* Squares */}
        <div className="absolute bg-purple-300 opacity-16 rounded-lg" style={{ width: 64, height: 64, top: 260, right: 60 }} />
        <div className="absolute bg-green-200 opacity-20 rounded-lg" style={{ width: 40, height: 40, bottom: 60, right: 180 }} />
        {/* Triangles */}
        <div className="absolute bg-orange-200 opacity-18" style={{ width: 70, height: 70, top: 100, left: 240, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute bg-cyan-200 opacity-15" style={{ width: 48, height: 48, bottom: 180, right: 80, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      </div>
      <div className="container mx-auto px-4 relative z-10" data-id="rcygzcvgt" data-path="src/components/CountryPackagesSection.tsx">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16" data-id="alypkjr07" data-path="src/components/CountryPackagesSection.tsx">

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-id="nt75tfjsi" data-path="src/components/CountryPackagesSection.tsx">
            {t('select_destination')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12" data-id="4pai7lstn" data-path="src/components/CountryPackagesSection.tsx">
            {t('select_destination_desc')}
          </p>

          {/* Country Search */}
          <CountrySearch
            onCountrySelect={setSelectedCountry}
            selectedCountry={selectedCountry}
            forceOpen={forceOpenSearch}
            data-id="310qa4gcj" data-path="src/components/CountryPackagesSection.tsx" />

          {/* Add extra margin below the search to allow dropdown to expand */}
          <div className="mb-56" />

        </motion.div>

        {/* Package Cards */}
        {selectedCountry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-8" data-id="ff38nkn9d" data-path="src/components/CountryPackagesSection.tsx">
              <h3 className="text-2xl font-bold text-gray-900 mb-2" data-id="rgicu6u1e" data-path="src/components/CountryPackagesSection.tsx">
                {t('esim_plans_for') + ' ' + selectedCountry.name[language]}
              </h3>
              <p className="text-gray-600" data-id="x69mqybfm" data-path="src/components/CountryPackagesSection.tsx">
                {t('choose_plan')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-id="3gm2sdsca" data-path="src/components/CountryPackagesSection.tsx">
              {selectedCountry.packages.map((packageItem, index) =>
                <PackageCard
                  key={packageItem.id}
                  title={`${packageItem.data} / ${packageItem.validity} / ${packageItem.coverage}`}
                  price={packageItem.price}
                  data={packageItem.data}
                  validity={packageItem.validity}
                  coverage={packageItem.coverage}
                  description={packageItem.description}
                  bonusData={packageItem.bonusData}
                  isOffer={packageItem.isOffer}
                  isPopular={index === 1}
                  specialFeatures={packageItem.specialFeatures}
                  delay={index * 0.1}
                  flagUrl={selectedCountry.flag}
                  countryCode={selectedCountry.code}
                  packageId={packageItem.id}
                />
              )}
            </div>

            {/* Additional Info */}
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-12 text-center" data-id="e9ai1n3d3" data-path="src/components/CountryPackagesSection.tsx">

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 max-w-4xl mx-auto" data-id="tzyeyv1o9" data-path="src/components/CountryPackagesSection.tsx">
                <h4 className="text-xl font-bold text-gray-900 mb-4" data-id="c9yblha8n" data-path="src/components/CountryPackagesSection.tsx">
                  {t('why_choose_esim')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600" data-id="v0lsg3zpz" data-path="src/components/CountryPackagesSection.tsx">
                  <div className="flex flex-col items-center" data-id="mzp6pc3nh" data-path="src/components/CountryPackagesSection.tsx">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3" data-id="lu57ib73g" data-path="src/components/CountryPackagesSection.tsx">
                      <Wifi className="w-6 h-6 text-blue-600" data-id="nczg7qex0" data-path="src/components/CountryPackagesSection.tsx" />
                    </div>
                    <p className="font-medium" data-id="i90yqprge" data-path="src/components/CountryPackagesSection.tsx">
                      {t('feature_lightning_fast')}
                    </p>
                    <p className="text-xs" data-id="ktb1tnl5e" data-path="src/components/CountryPackagesSection.tsx">
                      {t('feature_high_speed_networks')}
                    </p>
                  </div>
                  <div className="flex flex-col items-center" data-id="9l3rb9hue" data-path="src/components/CountryPackagesSection.tsx">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3" data-id="10whicdxn" data-path="src/components/CountryPackagesSection.tsx">
                      <Clock className="w-6 h-6 text-green-600" data-id="n34t2lkup" data-path="src/components/CountryPackagesSection.tsx" />
                    </div>
                    <p className="font-medium" data-id="a6dzqswhe" data-path="src/components/CountryPackagesSection.tsx">
                      {t('instant_activation')}
                    </p>
                    <p className="text-xs" data-id="6exnik29z" data-path="src/components/CountryPackagesSection.tsx">
                      {t('feature_get_connected')}
                    </p>
                  </div>
                  <div className="flex flex-col items-center" data-id="6t8bq838u" data-path="src/components/CountryPackagesSection.tsx">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3" data-id="63e3c075h" data-path="src/components/CountryPackagesSection.tsx">
                      <Globe className="w-6 h-6 text-purple-600" data-id="6rul2puwg" data-path="src/components/CountryPackagesSection.tsx" />
                    </div>
                    <p className="font-medium" data-id="r202hwouz" data-path="src/components/CountryPackagesSection.tsx">
                      {t('global_coverage')}
                    </p>
                    <p className="text-xs" data-id="u6es2fgkm" data-path="src/components/CountryPackagesSection.tsx">
                      {t('feature_works_in_countries')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* KudoSim eSIM Features Section (screenshot style) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-16 bg-white/90 rounded-3xl shadow-lg p-8 md:p-16 flex flex-col md:flex-row items-center gap-12"
            >
              {/* Illustration/Logo Placeholder */}
              <div className="flex-1 flex flex-col items-center justify-center mb-8 md:mb-0">
                <div className="w-64 h-80 bg-gradient-to-br from-yellow-200 to-purple-200 rounded-2xl flex flex-col items-center justify-center relative">
                  {/* Replace this div with your image/logo later */}
                  <span className="text-4xl font-bold text-purple-700">[KudoSim Logo]</span>
                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-6xl font-extrabold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text select-none">5G</span>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg text-gray-600">[Illustration Placeholder]</span>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {language === 'al' ? 'Rrini të lidhur kudo që të shkoni me KudoSim: eSIM me shpejtësi 4G/5G' : 'Stay connected wherever you go with KudoSim: eSIM with 4G/5G speed'}
                  </h3>
                </div>
              </div>
              {/* Features Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Feature 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    {/* Replace with your icon */}
                    <span className="text-2xl">🌍</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {language === 'al' ? 'Lidhje Globale' : 'Global Connectivity'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {language === 'al'
                        ? 'Me Kudo eSIM, eksploroni çdo kontinent pa u ndalur. Qofshin udhëtimet në Europë, Amerikën e Veriut, Azinë, apo Afrikën, jini gjithmonë të lidhur me internet.'
                        : 'With Kudo eSIM, explore every continent without stopping. Whether traveling in Europe, North America, Asia, or Africa, always stay connected to the internet.'}
                    </p>
                  </div>
                </div>
                {/* Feature 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    {/* Replace with your icon */}
                    <span className="text-2xl">🚫</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {language === 'al' ? 'Pa Tarifa Roaming' : 'No Roaming Fees'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {language === 'al'
                        ? 'Udhëtoni pa shqetësime me Kudo eSIM. Harroni faturat e papritura të roamingut dhe shijoni lirinë e vërtetë të udhëtimit.'
                        : 'Travel worry-free with Kudo eSIM. Forget unexpected roaming bills and enjoy true travel freedom.'}
                    </p>
                  </div>
                </div>
                {/* Feature 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    {/* Replace with your icon */}
                    <span className="text-2xl">📶</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {language === 'al' ? 'SIM Kartela Aktive' : 'Active SIM Card'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {language === 'al'
                        ? 'Përdorni Kudo eSIM dhe mbajeni kartën tuaj fizike aktive. Pranoni thirrje dhe SMS ndërkohë që shijoni shërbimet e internetit nga eSIM.'
                        : 'Use Kudo eSIM and keep your physical SIM card active. Receive calls and SMS while enjoying internet services from eSIM.'}
                    </p>
                  </div>
                </div>
                {/* Feature 4 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    {/* Replace with your icon */}
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {language === 'al' ? 'Aktivizim i Menjëhershëm' : 'Instant Activation'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {language === 'al'
                        ? 'Hapni botën tuaj me një klikim. Aktivizimi i Kudo eSIM është i thjeshtë dhe i menjëhershëm pas pagesës, pa procedura të mërzitshme.'
                        : 'Open your world with one click. Kudo eSIM activation is simple and instant after payment, with no tedious procedures.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>);

};

export default CountryPackagesSection;