import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DownloadCloud } from "lucide-react";
import CountrySearch from "./CountrySearch";
import { Country } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

// Custom 5G chip SVG
const FiveGChipIcon = () => {
  const { t } = useLanguage();
  return (
    <span aria-label={t('network_5g')} className="inline-block">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="4" y="10" width="40" height="28" rx="8" fill="url(#chipGradient)" />
        <rect x="10" y="16" width="28" height="16" rx="4" fill="#fff" fillOpacity="0.15" />
        <text x="50%" y="62%" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="Inter, sans-serif">5G</text>
        <defs>
          <linearGradient id="chipGradient" x1="4" y1="10" x2="44" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7B2FF2" />
            <stop offset="1" stopColor="#00C6FF" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
};

// Custom World Globe Icon
const GlobeNetworkIcon = () => {
  const { t } = useLanguage();
  return (
    <span aria-label={t('global_world')} className="inline-block">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main globe circle with ocean gradient */}
        <circle cx="22" cy="22" r="20" fill="url(#oceanGradient)" />
        
        {/* World map continents (simplified) */}
        <g fill="url(#landGradient)">
          {/* North America */}
          <path d="M12 14c2-1 4-1 6 0 1 1 2 3 2 4 0 2-1 3-2 4-1 1-3 1-4 0-2-1-3-3-2-8z" />
          
          {/* South America */}
          <path d="M16 26c1-2 3-3 5-2 1 1 2 2 2 4 0 1-1 2-2 3-2 1-4 1-5-1-1-2-1-4 0-4z" />
          
          {/* Europe */}
          <path d="M24 12c1 0 2 1 2 2 0 1-1 2-2 2-1 0-2-1-2-2 0-1 1-2 2-2z" />
          
          {/* Africa */}
          <path d="M26 18c1-1 3-1 4 0 1 1 1 3 0 4-1 1-3 1-4 0-1-1-1-3 0-4z" />
          
          {/* Asia */}
          <path d="M28 14c2 0 4 1 4 3 0 2-2 3-4 3-2 0-4-1-4-3 0-2 2-3 4-3z" />
          
          {/* Australia */}
          <path d="M32 24c1 0 2 1 2 2 0 1-1 2-2 2-1 0-2-1-2-2 0-1 1-2 2-2z" />
        </g>
        
        {/* Grid lines */}
        <g stroke="#fff" strokeWidth="0.5" strokeOpacity="0.2">
          {/* Latitude lines */}
          <path d="M8 22h28" />
          <path d="M12 16h20" />
          <path d="M14 28h16" />
          
          {/* Longitude lines */}
          <path d="M22 8v28" />
          <path d="M16 12v20" />
          <path d="M28 12v20" />
        </g>
        
        {/* Globe highlights */}
        <ellipse cx="22" cy="22" rx="14" ry="7" fill="#fff" fillOpacity="0.1" />
        <ellipse cx="22" cy="22" rx="10" ry="18" fill="#fff" fillOpacity="0.05" />
        
        {/* Animated shine effect */}
        <path d="M22 2a20 20 0 0 1 0 40 20 20 0 0 1 0-40" fill="url(#shineGradient)">
          <animate
            attributeName="opacity"
            values="0.1;0.2;0.1"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
        
        <defs>
          {/* Ocean gradient - deep blue to lighter blue */}
          <linearGradient id="oceanGradient" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1B4B8C" />
            <stop offset="0.5" stopColor="#2B6CB0" />
            <stop offset="1" stopColor="#4299E1" />
          </linearGradient>
          
          {/* Land gradient - forest green to lighter green */}
          <linearGradient id="landGradient" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2F855A" />
            <stop offset="0.5" stopColor="#38A169" />
            <stop offset="1" stopColor="#48BB78" />
          </linearGradient>
          
          {/* Shine effect gradient */}
          <linearGradient id="shineGradient" x1="22" y1="2" x2="22" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
};

const HeroSection = () => {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Slideshow images
  const slides = [
    "/images/slide1.jpg",
    "/images/slide2.jpg", 
    "/images/slide3.jpg"
  ];

  // Preload images for smoother transitions
  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide;
    });
  }, []);

  // Auto-advance slideshow every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    // Navigate to country page instead of packages page
    navigate(`/country/${country.code}`);
  };

  return (
    <section className="min-h-[30vh] relative flex flex-col md:flex-row items-stretch justify-center px-0 md:px-0 mt-8">
      {/* Left: Empty for future use */}
      <div className="hidden md:flex flex-col w-1/12" />
      {/* Center: Heading + Button, with phone image to the right */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full md:w-10/12 px-4 py-2 md:py-0 gap-4">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FiveGChipIcon />
            <GlobeNetworkIcon />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-center leading-tight tracking-tight text-gray-800 dark:text-gray-200 drop-shadow-lg mb-2" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {t('hero_main_title')}
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-2">
            <CountrySearch
              onCountrySelect={handleCountrySelect}
              selectedCountry={selectedCountry}
              forceOpen={false}
            />
            <a href="#most-popular-packages" className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white bg-slate-800 rounded-lg shadow-md hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                <DownloadCloud className="w-5 h-5" />
                {t('hero_activate_package')}
            </a>
          </div>
        </div>
        {/* Phone/Logo image, right of text on desktop, below on mobile */}
        <div className="relative flex flex-col items-center justify-center flex-1 sm:mt-0 mt-4">
          {/* Phone Mockup Container */}
          <motion.div 
            className="relative w-64 h-[32rem] flex items-center justify-center"
            style={{ willChange: 'transform' }}
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Phone Frame - Professional Design */}
            <div className="absolute w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-[2.5rem] shadow-2xl border-[6px] border-gray-700">
              {/* Screen Bezel */}
              <div className="absolute inset-1 bg-gradient-to-br from-gray-900 to-black rounded-[2rem]">
                {/* Screen */}
                <div className="w-full h-full bg-black rounded-[1.8rem] overflow-hidden relative">
                  {/* Dynamic Island / Camera Cutout Removed for clear image */}
                  
                  {/* Slideshow Container */}
                  <div className="w-full h-full flex items-center justify-center relative">
                    {slides.map((slide, index) => (
                      <motion.img
                        key={slide}
                        src={slide}
                        alt={`${t('slide')} ${index + 1}`}
                        className="absolute w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: currentSlide === index ? 1 : 0,
                          transition: { duration: 0.8, ease: "easeInOut" }
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Home Indicator */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-white rounded-full opacity-40"></div>
                  
                  {/* Screen Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white opacity-5 rounded-[1.8rem] pointer-events-none"></div>
                </div>
              </div>
              
              {/* Phone Side Buttons */}
              <div className="absolute right-0 top-16 w-1 h-8 bg-gray-600 rounded-l-full"></div>
              <div className="absolute right-0 top-28 w-1 h-8 bg-gray-600 rounded-l-full"></div>
              <div className="absolute left-0 top-20 w-1 h-12 bg-gray-600 rounded-r-full"></div>
            </div>
            
            {/* Professional Shadow */}
            <div className="absolute -bottom-6 w-60 h-6 bg-gradient-to-t from-black/30 via-black/10 to-transparent rounded-full blur-xl"></div>
            
            {/* Ambient Light Reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-[2.5rem] pointer-events-none"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;