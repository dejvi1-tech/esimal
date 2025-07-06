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

  // Duplicate logos for seamless looping
  const marqueeLogos = [...logos, ...logos];

  return (
    <section className="py-12 overflow-hidden w-full bg-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('logo_slider_title')}
          </h2>
        </div>
        <div className="relative w-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#4B0082] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#4B0082] to-transparent z-10 pointer-events-none" />
          <div
            className="logo-marquee flex gap-12 whitespace-nowrap"
          >
            {marqueeLogos.map((logo, index) => (
              <div
                key={`logo-${index}`}
                className="flex-shrink-0 w-40 h-20 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-4 shadow-lg mx-2"
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
      {/* Marquee keyframes */}
      <style>{`
        .logo-marquee {
          animation: marquee 32s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (max-width: 640px) {
          .logo-marquee { gap: 2rem !important; }
        }
      `}</style>
    </section>
  );
};

export default LogoSlider; 