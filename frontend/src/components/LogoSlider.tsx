import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LogoSliderProps {
  logos: {
    src: string;
    alt: string;
  }[];
}

const LogoSlider: React.FC<LogoSliderProps> = ({ logos }) => {
  const { t } = useLanguage();

  return (
    <section className="hidden md:block py-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            {t('logo_slider_title')}
          </h2>
        </div>

        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-100/30 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-100/30 to-transparent z-10" />
          
          <div
            className="flex gap-12 px-4"
            style={{
              width: 'fit-content',
            }}
          >
            {/* Logos */}
            {logos.map((logo, index) => (
              <div
                key={`logo-${index}`}
                className="flex-shrink-0 w-40 h-20 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 rounded-lg p-4 shadow-lg transition-all duration-300"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoSlider; 