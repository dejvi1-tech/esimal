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

  return (
    <section className="w-full flex flex-col items-center justify-center px-0 md:px-0 mt-8">
      {/* Panda Hero Image - full width, centered */}
      <picture>
        <source srcSet="/optimized/pandahero1.webp" type="image/webp" />
        <img
          src="/optimized/pandahero1.png"
          alt="Panda Hero"
          className=" mx-auto mb-6"
          style={{
            display: 'block',
            maxWidth: '900px',
            width: '100%',
            height: '400px',
            objectFit: 'cover',
            opacity: 0.7,
            paddingTop: '15px', // or '2rem', '40px', etc.
            
          }}
        />
      </picture>
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