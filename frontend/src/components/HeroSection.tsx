import { useState } from "react";
import { DownloadCloud } from "lucide-react";
import CountrySearch from "./CountrySearch";
import { Country } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { countrySlug } from '../lib/utils';

const HeroSection = () => {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const navigate = useNavigate();

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    // Navigate to country page instead of packages page
    navigate(`/country/${countrySlug(country.name.en)}`);
  };

  const handleImageLoad = () => {
    console.log('Panda hero image loaded successfully');
  };

  const handleImageError = (error: any) => {
    console.error('Error loading panda hero image:', error);
  };

  return (
    <section className="w-full flex flex-col items-center justify-center px-0 md:px-0 mt-8" style={{ minHeight: '600px' }}>
      {/* Panda Hero Image - wide 21:9 aspect ratio */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        height: '440px', // fixed height
        overflow: 'hidden',
        margin: '0 auto',
        background: '#4B0082',
        borderRadius: '16px',
      }}>
        <picture>
          <source srcSet="/pandahero9.webp" type="image/webp" />
          <img
            src="/pandahero9.webp"
            alt="Panda Hero"
            className=" mx-auto mb-6"
            style={{
              display: 'block',
              maxWidth: '950px',
              width: '100%',
              height: '450px',
              objectFit: 'cover',
              opacity: 0.8,
              paddingTop: '5px',
              paddingBottom: '5px',
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </picture>
      </div>
      {/* Centered: Heading + Button, with search and logo below image */}
      <div className="flex flex-col items-center justify-center w-full px-4 py-2 gap-4">
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-center leading-tight tracking-tight text-white drop-shadow-lg mb-2" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {t('hero_main_title')}
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-2">
          <CountrySearch
            onCountrySelect={handleCountrySelect}
            selectedCountry={selectedCountry}
            forceOpen={false}
          />
          <a href="#most-popular-packages" className="btn-glass inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white">
              <DownloadCloud className="w-5 h-5" />
              {t('hero_activate_package')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;