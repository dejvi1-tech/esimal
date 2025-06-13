import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();
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
    <section ref={sectionRef} className="relative overflow-hidden py-20 bg-gradient-to-br from-yellow-50 to-purple-50">
      {/* Parallax Shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {shapes.map((shape, idx) => (
          <div
            key={idx}
            className={`absolute ${shape.className} opacity-60`}
            style={{
              ...shape.style,
              transform: `translateY(${scrollY * shape.speed}px)`,
              zIndex: 1,
              transition: 'transform 0.2s cubic-bezier(.4,1.6,.6,1)',
            }}
          />
        ))}
      </div>
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12 relative z-10">
        {/* Text above Logo Image */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8 md:mb-0">
          <div className="mb-2 text-center">
            <h3 className="text-2xl font-bold text-gray-900">
              {language === 'al'
                ? 'Rrini të lidhur kudo që të shkoni me eSimFly: eSIM me shpejtësi 4G/5G'
                : 'Stay connected wherever you go with eSimFly: eSIM with 4G/5G speed'}
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
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900">
                {language === 'al' ? 'Lidhje Globale' : 'Global Connectivity'}
              </h4>
              <p className="text-gray-600 text-sm">
                {language === 'al'
                  ? 'Me eSimFly, eksploroni çdo kontinent pa u ndalur. Qofshin udhëtimet në Europë, Amerikën e Veriut, Azinë, apo Afrikën, jini gjithmonë të lidhur me internet.'
                  : 'With eSimFly, explore every continent without stopping. Whether traveling in Europe, North America, Asia, or Africa, always stay connected to the internet.'}
              </p>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900">
                {language === 'al' ? 'Pa Tarifa Roaming' : 'No Roaming Fees'}
              </h4>
              <p className="text-gray-600 text-sm">
                {language === 'al'
                  ? 'Udhëtoni pa shqetësime me eSimFly. Harroni faturat e papritura të roamingut dhe shijoni lirinë e vërtetë të udhëtimit.'
                  : 'Travel worry-free with eSimFly. Forget unexpected roaming bills and enjoy true travel freedom.'}
              </p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📶</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900">
                {language === 'al' ? 'SIM Kartela Aktive' : 'Active SIM Card'}
              </h4>
              <p className="text-gray-600 text-sm">
                {language === 'al'
                  ? 'Përdorni eSimFly dhe mbajeni kartën tuaj fizike aktive. Pranoni thirrje dhe SMS ndërkohë që shijoni shërbimet e internetit nga eSIM.'
                  : 'Use eSimFly and keep your physical SIM card active. Receive calls and SMS while enjoying internet services from eSIM.'}
              </p>
            </div>
          </div>
          {/* Feature 4 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900">
                {language === 'al' ? 'Aktivizim i Menjëhershëm' : 'Instant Activation'}
              </h4>
              <p className="text-gray-600 text-sm">
                {language === 'al'
                  ? 'Hapni botën tuaj me një klikim. Aktivizimi i eSimFly është i thjeshtë dhe i menjëhershëm pas pagesës, pa procedura të mërzitshme.'
                  : 'Open your world with one click. eSimFly activation is simple and instant after payment, with no tedious procedures.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KudoSimSection; 