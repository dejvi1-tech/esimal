import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

// --- SVG Icons for Regions ---
const EuropeIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M38.8,24.3c-2.3,0.8-3.4,3.2-3.8,5.6c-0.3,1.6-0.3,3.3-0.2,4.9c0.1,2,0.5,4,1.4,5.8c0.8,1.7,2,3.3,3.5,4.4 c1.6,1.2,3.5,2,5.5,2.3c2-0.1,4-0.8,5.6-2c1.3-1,2.3-2.3,3.1-3.7c1.1-2.1,1.6-4.4,1.5-6.7c-0.1-2.4-0.8-4.7-2.1-6.6 c-1.2-1.8-2.9-3.2-4.9-3.9c-2.2-0.8-4.5-0.8-6.7,0C43.1,23.1,40.9,23.5,38.8,24.3z M62,31.5c1,0.2,1.9,0.7,2.8,1.3 c1.5,1,2.6,2.4,3.3,4c0.4,1,0.7,2,0.8,3.1c0.1,1.1,0,2.2-0.3,3.3c-0.6,2.2-1.9,4.1-3.7,5.4c-1,0.7-2.2,1.2-3.4,1.4 c-1.2,0.2-2.4,0.1-3.6-0.2c-1.8-0.5-3.4-1.5-4.6-2.9c-0.9-1-1.6-2.2-2-3.5c-0.5-1.6-0.6-3.3-0.3-5c0.3-1.8,1-3.5,2.1-4.9 c1.2-1.5,2.8-2.6,4.6-3.1C58.6,30.2,60.5,30.6,62,31.5z"/></svg>;
const EuropeBalkanIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor"><circle cx="50" cy="50" r="4"/><circle cx="65" cy="50" r="4"/><circle cx="35" cy="50" r="4"/><circle cx="50" cy="35" r="4"/><circle cx="50" cy="65" r="4"/><circle cx="62" cy="38" r="4"/><circle cx="38" cy="62" r="4"/><circle cx="38" cy="38" r="4"/><circle cx="62" cy="62" r="4"/></g></svg>;
const AfricaIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M49.4,24.9c-1.4,1-2.6,2.3-3.6,3.7c-1,1.5-1.8,3.1-2.4,4.8c-0.6,1.7-1,3.5-1.2,5.3c-0.2,1.8-0.2,3.7,0,5.5 c0.2,1.9,0.6,3.8,1.2,5.6c1.1,3.3,3,6.2,5.6,8.4c2.5,2.1,5.6,3.5,8.9,4c3.4,0.5,6.8,0.1,10-1.2c2.8-1.1,5.3-2.9,7.2-5.2 c1.6-1.9,2.8-4.2,3.4-6.6c0.6-2.4,0.7-4.9,0.2-7.3c-0.5-2.5-1.5-4.8-2.9-6.9c-1.4-2.1-3.3-3.9-5.4-5.2c-2.1-1.3-4.5-2.1-7-2.3 c-2.4-0.2-4.9,0.2-7.1,1C51.9,23.9,50.7,24.3,49.4,24.9z"/></svg>;
const AsiaIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M34.7,40.1c-0.5,2.1-0.4,4.2,0.1,6.3c0.6,2.1,1.6,4,3,5.6c1.4,1.6,3.2,2.9,5.1,3.7c2,0.8,4.1,1.1,6.2,0.9 c2.1-0.2,4.1-0.9,5.9-2.1c1.8-1.2,3.3-2.8,4.4-4.7c1-1.9,1.7-4,1.8-6.1c0.1-2.2-0.3-4.3-1.2-6.3c-0.8-2-2.2-3.7-3.8-5.1 c-1.7-1.4-3.7-2.4-5.8-2.9c-2.1-0.5-4.3-0.5-6.4,0.1c-2.1,0.6-4.1,1.6-5.7,3.1C36.3,37,35.3,38.5,34.7,40.1z M65,46 c-0.5-1.2-1.3-2.2-2.3-2.9c-1-0.7-2.2-1.1-3.4-1.2c-1.2-0.1-2.4,0.2-3.5,0.8c-1.1,0.6-2.1,1.4-2.8,2.5c-0.7,1-1.2,2.2-1.3,3.4 c-0.1,1.2,0.2,2.4,0.8,3.5c0.6,1.1,1.4,2.1,2.5,2.8c1,0.7,2.2,1.1,3.4,1.2c1.2,0.1,2.4-0.2,3.5-0.8c1.1-0.6,2.1-1.4,2.8-2.5 c0.7-1,1.2-2.2,1.3-3.4C65.4,48.4,65.2,47.2,65,46z"/></svg>;
const NorthAmericaIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M36.1,33.1c-1,1.8-1.5,3.9-1.6,5.9c-0.1,2.1,0.3,4.1,1.1,6c0.8,1.9,2.1,3.6,3.7,4.9c1.6,1.3,3.5,2.2,5.5,2.6 c2,0.4,4-0.1,5.8-1.1c1.8-1,3.3-2.5,4.4-4.2c1.1-1.8,1.7-3.8,1.8-5.8c0.1-2-0.3-4-1.1-5.9c-0.8-1.9-2.1-3.6-3.7-4.9 c-1.6-1.3-3.5-2.2-5.5-2.6c-2-0.4-4,0.1-5.8,1.1C39,29.9,37.5,31.4,36.1,33.1z M52.5,49.5c0.1,2-0.4,4-1.3,5.7 c-0.9,1.7-2.3,3.1-4,4c-1.7,0.9-3.7,1.3-5.6,1.2c-1.9-0.1-3.8-0.7-5.3-1.8c-1.5-1-2.7-2.5-3.4-4.2c-0.6-1.7-0.7-3.5-0.4-5.3 c0.4-1.8,1.2-3.4,2.4-4.8c1.2-1.3,2.8-2.4,4.5-2.9c1.7-0.5,3.5-0.5,5.3,0c1.8,0.5,3.4,1.5,4.8,2.8 C51.7,46.5,52.4,48,52.5,49.5z"/></svg>;
const SouthAmericaIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M49.8,26.4c-0.9,2.5-1.1,5.1-0.6,7.7c0.5,2.6,1.7,5,3.5,7c1.8,2,4.1,3.5,6.7,4.3c2.6,0.8,5.4,0.9,8,0.2 c2.6-0.6,5-2,6.9-3.9c1.9-1.9,3.2-4.3,3.9-6.9c0.6-2.6,0.5-5.4-0.2-8c-0.8-2.6-2.2-5-4.3-6.7c-2-1.8-4.5-3-7-3.5 C54.9,25.3,52.3,25.5,49.8,26.4z"/></svg>;
const MiddleEastIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M40,35.1c-0.3,1.6-0.3,3.2,0,4.8c0.3,1.6,0.9,3.1,1.8,4.5c0.9,1.4,2.1,2.6,3.5,3.5c1.4,0.9,3,1.5,4.6,1.8 c1.6,0.3,3.2,0.3,4.8,0c1.6-0.3,3.1-0.9,4.5-1.8c1.4-0.9,2.6-2.1,3.5-3.5c0.9-1.4,1.5-3,1.8-4.6c0.3-1.6,0.3-3.2,0-4.8 c-0.3-1.6-0.9-3.1-1.8-4.5c-0.9-1.4-2.1-2.6-3.5-3.5c-1.4-0.9-3-1.5-4.6-1.8c-1.6-0.3-3.2-0.3-4.8,0c-1.6,0.3-3.1,0.9-4.5,1.8 C42.1,32.5,40.9,33.7,40,35.1z M52.5,40c0.8,0,1.6,0.3,2.2,0.8c0.6,0.5,1.1,1.2,1.3,2c0.2,0.8,0.2,1.6-0.1,2.4 c-0.2,0.8-0.7,1.5-1.3,2c-0.6,0.5-1.4,0.8-2.2,0.8c-0.8,0-1.6-0.3-2.2-0.8c-0.6-0.5-1.1-1.2-1.3-2c-0.2-0.8-0.2-1.6,0.1-2.4 C49.4,41.2,49.9,40.5,50.5,40z"/></svg>;
const IllyriaIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M50,25c-5.5,0-10,4.5-10,10v10h-5c-2.8,0-5,2.2-5,5v10c0,2.8,2.2,5,5,5h5v10c0,5.5,4.5,10,10,10s10-4.5,10-10v-10h5 c2.8,0,5-2.2,5-5v-10c0-2.8-2.2-5-5-5h-5v-10C60,29.5,55.5,25,50,25z M45,45h10v10h-10V45z M45,65h10v10h-10V65z M35,45h5v10h-5 c-1.7,0-3-1.3-3-3v-4C32,46.3,33.3,45,35,45z M65,55h-5v-10h5c1.7,0,3,1.3,3,3v4C68,53.7,66.7,55,65,55z"/></svg>;

const FlagIcon = ({ code, name }: { code: string; name: string }) => (
  <img
    src={`https://flagcdn.com/w40/${code}.png`}
    alt={`${name} Flag`}
    className="w-full h-full object-cover rounded-full"
  />
);

// --- Data for Bundles ---
const bundleData = {
  Lokale: [
    { id: 'albania', name: 'Albania', icon: <FlagIcon code="al" name="Albania" /> },
    { id: 'turkey', name: 'Turkey', icon: <FlagIcon code="tr" name="Turkey" /> },
    { id: 'dubai', name: 'Dubai', icon: <FlagIcon code="ae" name="Dubai" /> },
    { id: 'france', name: 'France', icon: <FlagIcon code="fr" name="France" /> },
    { id: 'germany', name: 'Germany', icon: <FlagIcon code="de" name="Germany" /> },
    { id: 'switzerland', name: 'Switzerland', icon: <FlagIcon code="ch" name="Switzerland" /> },
    { id: 'new-york', name: 'New York', icon: <FlagIcon code="us" name="New York" /> },
    { id: 'austria', name: 'Austria', icon: <FlagIcon code="at" name="Austria" /> },
    { id: 'italy', name: 'Italy', icon: <FlagIcon code="it" name="Italy" /> },
    { id: 'china', name: 'China', icon: <FlagIcon code="cn" name="China" /> },
    { id: 'maldives', name: 'Maldives', icon: <FlagIcon code="mv" name="Maldives" /> },
    { id: 'croatia', name: 'Croatia', icon: <FlagIcon code="hr" name="Croatia" /> },
    { id: 'finland', name: 'Finland', icon: <FlagIcon code="fi" name="Finland" /> },
    { id: 'spain', name: 'Spain', icon: <FlagIcon code="es" name="Spain" /> },
    { id: 'thailand', name: 'Thailand', icon: <FlagIcon code="th" name="Thailand" /> },
    { id: 'uk', name: 'United Kingdom', icon: <FlagIcon code="gb" name="United Kingdom" /> },
    { id: 'saudi-arabia', name: 'Saudi Arabia', icon: <FlagIcon code="sa" name="Saudi Arabia" /> },
    { id: 'greece', name: 'Greece', icon: <FlagIcon code="gr" name="Greece" /> },
    { id: 'kosovo', name: 'Kosovo', icon: <FlagIcon code="xk" name="Kosovo" /> },
    { id: 'sweden', name: 'Sweden', icon: <FlagIcon code="se" name="Sweden" /> },
    { id: 'canada', name: 'Canada', icon: <FlagIcon code="ca" name="Canada" /> },
    { id: 'netherlands', name: 'Netherlands', icon: <FlagIcon code="nl" name="Netherlands" /> },
    { id: 'illyria', name: 'Illyria', icon: <IllyriaIcon /> },
  ],
  Rajonale: [
    { id: 'europe', name: 'Europe', icon: <EuropeIcon /> },
    { id: 'africa', name: 'Africa', icon: <AfricaIcon /> },
    { id: 'asia', name: 'Asia', icon: <AsiaIcon /> },
    { id: 'north-america', name: 'North America', icon: <NorthAmericaIcon /> },
    { id: 'south-america', name: 'South America', icon: <SouthAmericaIcon /> },
    { id: 'middle-east', name: 'Middle East', icon: <MiddleEastIcon /> },
  ],
  Global: [
    { id: 'europe-balkan', name: 'Europe & Balkan', icon: <EuropeBalkanIcon /> },
  ],
};

const BundlePackagesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('Lokale');
  const navigate = useNavigate();

  const TABS = [t('local'), t('regional'), t('global')];
  const tabKeys = ['Lokale', 'Rajonale', 'Global'];

  const handleCardClick = (bundleId: string) => {
    navigate(`/bundle/${bundleId}`);
  };

  return (
    <section className="py-16 font-sans">
      <div className="container mx-auto px-4">
        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-2 bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 p-1.5 rounded-xl">
            {tabKeys.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                } relative px-6 py-2 text-md font-bold rounded-lg transition-colors`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{TABS[idx]}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Content Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {bundleData[activeTab as keyof typeof bundleData].map((bundle) => (
              <motion.div
                key={bundle.id}
                onClick={() => handleCardClick(bundle.id)}
                className="text-center p-4 bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-violet-300 hover:-translate-y-1"
              >
                <div className="w-20 h-20 mx-auto bg-white/20 text-slate-800 dark:text-white rounded-full flex items-center justify-center mb-4">
                  <div className="w-12 h-12">{bundle.icon}</div>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t(`bundle_${bundle.id}`) || bundle.name}</h3>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default BundlePackagesSection; 