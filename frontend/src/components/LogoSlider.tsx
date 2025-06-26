import React, { useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface LogoSliderProps {
  logos: {
    src: string;
    alt: string;
  }[];
}

const LogoSlider: React.FC<LogoSliderProps> = ({ logos }) => {
  const { t } = useLanguage();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate the total width of one set of logos
  const logoWidth = 160; // w-40 = 160px
  const gap = 48; // gap-12 = 48px
  const totalWidth = (logoWidth + gap) * logos.length;

  useEffect(() => {
    const startAnimation = async () => {
      await controls.start({
        x: [0, -totalWidth],
        transition: {
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 20,
            ease: "linear",
          },
        },
      });
    };

    startAnimation();
  }, [controls, totalWidth]);

  return (
    <section className="hidden md:block py-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            {t('logo_slider_title')}
          </h2>
        </motion.div>

        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-100/30 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-100/30 to-transparent z-10" />
          
          <motion.div
            ref={containerRef}
            className="flex gap-12 px-4"
            animate={controls}
            style={{
              width: 'fit-content',
            }}
          >
            {/* First set of logos */}
            {logos.map((logo, index) => (
              <div
                key={`first-${index}`}
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
            {/* Duplicate set of logos for seamless loop */}
            {logos.map((logo, index) => (
              <div
                key={`second-${index}`}
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
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LogoSlider; 