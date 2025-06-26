import React from 'react';
import { motion } from 'motion/react';
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
    <motion.button
      onClick={toggleLanguage}
      className="group relative flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-white to-gray-50 border border-gray-200/60 text-gray-700 font-semibold hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300/60 hover:text-blue-700 transition-all duration-300 h-11 shadow-sm hover:shadow-md backdrop-blur-sm"
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Flag container with subtle animation */}
      <motion.div 
        className="relative bg-white/80 p-1.5 rounded-lg flex items-center justify-center shadow-sm"
        whileHover={{ rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        {language === 'al' ? englishFlag : albanianFlag}
      </motion.div>
      
      {/* Language text with better typography */}
      <span className="relative text-sm font-bold tracking-wide text-gray-700 group-hover:text-blue-700 transition-colors duration-200">
        {language === 'al' ? 'EN' : 'SQ'}
      </span>
      
      {/* Subtle indicator dot */}
      <motion.div 
        className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-60"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Hover border effect */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-300/30 transition-all duration-300"></div>
    </motion.button>
  );
};

export default LanguageSwitcher; 