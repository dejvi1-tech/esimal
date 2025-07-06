import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  const albanianFlag = (
    <svg viewBox="0 0 36 36" className="w-5 h-5 drop-shadow-sm">
      <rect width="36" height="36" fill="#E30A17"/>
      <path d="M7.2,25.2 L28.8,25.2 L28.8,10.8 L7.2,10.8 z" fill="#000000"/>
      <path d="M18,7.2 L19.8,13.5 L26.4,13.5 L20.7,17.1 L22.5,23.4 L18,19.8 L13.5,23.4 L15.3,17.1 L9.6,13.5 L16.2,13.5 z" fill="#000000"/>
    </svg>
  );

  const englishFlag = (
    <svg viewBox="0 0 36 36" className="w-5 h-5 drop-shadow-sm">
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
      className="backdrop-blur-lg bg-white/10 border border-white/20 flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold h-11 shadow-lg"
      type="button"
    >
      {/* Flag container */}
      <div className="bg-white/80 p-1.5 rounded-lg flex items-center justify-center shadow-sm">
        {language === 'al' ? englishFlag : albanianFlag}
      </div>
      
      {/* Language text */}
      <span className="text-sm font-bold tracking-wide text-white">
        {language === 'al' ? 'EN' : 'SQ'}
      </span>
      
      {/* Subtle indicator dot */}
      <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-60" />
    </button>
  );
};

export default LanguageSwitcher; 