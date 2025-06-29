import React, { useState, useMemo } from 'react';
import { Search, MapPin, Info } from 'lucide-react';
import { europeanCountries, Country } from '@/data/countries';
import { useLanguage } from '@/contexts/LanguageContext';

interface CountrySearchProps {
  onCountrySelect: (country: Country) => void;
  selectedCountry?: Country | null;
  forceOpen?: boolean;
}

const CountrySearch: React.FC<CountrySearchProps> = ({ onCountrySelect, selectedCountry, forceOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { language, t } = useLanguage();

  const USA_COUNTRY: Country = {
    code: 'US',
    name: { al: 'SHBA', en: 'USA' },
    flag: 'https://flagcdn.com/w40/us.png',
    region: 'North America',
    packages: europeanCountries[0]?.packages || []
  };

  const mostPopularCodes = ['IT', 'DE', 'GR', 'ES', 'FR', 'GB'];
  const mostPopularCountries = europeanCountries.filter(c => mostPopularCodes.includes(c.code));
  const restCountries = europeanCountries.filter(c => !mostPopularCodes.includes(c.code));
  const baseList = [USA_COUNTRY, ...mostPopularCountries, ...restCountries];
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return baseList;
    return baseList.filter((country) =>
      country.name[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.name.al.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, language]);

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setSearchTerm(country.name[language]);
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  return (
    <div className="relative w-full max-w-md mx-auto" ref={useClickAway(() => setIsOpen(false))}>
      {/* Trigger Input */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-300" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={language === 'al' ? 'Zgjidh ose kërko një shtet...' : 'Type or search a country...'}
          className="input-glass w-full pl-12 pr-12 py-4 text-lg rounded-full placeholder-gray-300 placeholder:font-semibold placeholder:text-base"
          aria-label={language === 'al' ? 'Kërko shtet' : 'Search country'}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-300" />
        </div>
      </div>

      {/* Dropdown List */}
      {(isOpen || forceOpen) && (
        <div className="absolute top-full mt-2 z-50 modal-glass rounded-xl max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col max-h-96 overflow-y-auto">
          {/* Most searched packages (EU and popular) */}
          <div className="mb-2 text-gray-300 font-semibold text-sm">Most searched packages</div>
          <div>
            {filteredCountries.length > 0 ? (
              <div>
                {filteredCountries.map((country, idx) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className="w-full px-4 py-3 text-left focus:outline-none rounded-lg glass-light"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={country.flag}
                        alt={country.name[language]}
                        className="w-8 h-8 object-cover rounded-full border border-white/20"
                      />
                      <span className="font-medium text-white text-lg">
                        {country.name[language]}
                      </span>
                      {(country.code === 'US' || mostPopularCodes.includes(country.code)) && (
                        <span className="ml-2 bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                          Most Popular
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 px-4 text-center text-gray-300">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple hook to detect clicks outside of a component
const useClickAway = (cb: () => void) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const refCb = React.useRef(cb);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const element = ref.current;
      if (element && !element.contains(e.target as Node)) {
        refCb.current();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  return ref;
};

export default CountrySearch;