import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  const albanianFlag = (
    <svg viewBox="0 0 36 36" className="w-5 h-5">
      <rect width="36" height="36" fill="#E30A17"/>
      <path d="M7.2,25.2 L28.8,25.2 L28.8,10.8 L7.2,10.8 z" fill="#000000"/>
      <path d="M18,7.2 L19.8,13.5 L26.4,13.5 L20.7,17.1 L22.5,23.4 L18,19.8 L13.5,23.4 L15.3,17.1 L9.6,13.5 L16.2,13.5 z" fill="#000000"/>
    </svg>
  );

  const englishFlag = (
    <svg viewBox="0 0 36 36" className="w-5 h-5">
      <rect width="36" height="36" fill="#012169"/>
      <path d="M0,0 L36,36 M36,0 L0,36" stroke="#FFFFFF" strokeWidth="4"/>
      <path d="M0,0 L36,36 M36,0 L0,36" stroke="#C8102E" strokeWidth="2.5"/>
      <path d="M18,0 L18,36 M0,18 L36,18" stroke="#FFFFFF" strokeWidth="6"/>
      <path d="M18,0 L18,36 M0,18 L36,18" stroke="#C8102E" strokeWidth="4"/>
    </svg>
  );

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-white text-blue-700 font-semibold hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 h-10 shadow-none"
      type="button"
    >
      <span className="bg-white/0 p-0 rounded-lg flex items-center justify-center">
        {language === 'al' ? englishFlag : albanianFlag}
      </span>
      <span className="text-sm tracking-wide font-semibold">{language === 'al' ? 'EN' : 'SQ'}</span>
    </button>
  );
};

export default LanguageSwitcher; 