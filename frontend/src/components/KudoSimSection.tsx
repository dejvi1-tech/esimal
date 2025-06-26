import { useLanguage } from '@/contexts/LanguageContext';
import React, { useEffect, useRef, useState } from 'react';

const kudosimImage = '/kudosim-logo.png';

const shapes = [
  { className: 'bg-purple-300', style: { width: 60, height: 60, borderRadius: '50%', top: 40, left: 40 }, speed: 0.2 },
  { className: 'bg-yellow-200', style: { width: 40, height: 40, borderRadius: '50%', top: 120, right: 80 }, speed: 0.4 },
  { className: 'bg-pink-300', style: { width: 32, height: 32, borderRadius: '50%', bottom: 80, left: 120 }, speed: 0.6 },
  { className: 'bg-purple-400', style: { width: 48, height: 48, borderRadius: '20%', top: 200, right: 40 }, speed: 0.3 },
  { className: 'bg-yellow-300', style: { width: 24, height: 24, borderRadius: '50%', bottom: 40, right: 120 }, speed: 0.5 },
  { className: 'bg-blue-200', style: { width: 36, height: 36, borderRadius: '50%', top: 60, right: 180 }, speed: 0.25 },
  { className: 'bg-pink-200', style: { width: 28, height: 28, borderRadius: '50%', bottom: 120, left: 60 }, speed: 0.35 },
  { className: 'bg-purple-200', style: { width: 54, height: 54, borderRadius: '20%', top: 300, left: 100 }, speed: 0.28 },
];

const KudoSimSection: React.FC = () => {
  const { t } = useLanguage();
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

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12 relative z-10">
        {/* Text above Logo Image */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8 md:mb-0">
          <div className="mb-2 text-center">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {t('kudosim_title')}
            </h3>
          </div>
          <video
            src="/kudosim-logo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full sm:w-80 md:w-96 h-auto rounded-2xl shadow-lg mb-6 mt-2"
            style={{ maxWidth: 420 }}
          />
        </div>
        {/* Features Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/30 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {t('kudosim_feature_1_title')}
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {t('kudosim_feature_1_desc')}
              </p>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/30 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {t('kudosim_feature_2_title')}
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {t('kudosim_feature_2_desc')}
              </p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/30 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📶</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {t('kudosim_feature_3_title')}
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {t('kudosim_feature_3_desc')}
              </p>
            </div>
          </div>
          {/* Feature 4 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/30 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {t('kudosim_feature_4_title')}
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {t('kudosim_feature_4_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KudoSimSection; 