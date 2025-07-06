import React, { useState, useCallback, useMemo } from 'react';
import { Search, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Country } from '@/data/countries';

interface CountrySearchProps {
  countries: Country[];
  onCountrySelect: (country: Country) => void;
  placeholder?: string;
}

const CountrySearch: React.FC<CountrySearchProps> = React.memo(({ 
  countries, 
  onCountrySelect, 
  placeholder = "Search countries..." 
}) => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize filtered countries for better performance
  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) {
      return countries.slice(0, 10); // Show first 10 countries when no search
    }
    
    return countries
      .filter(country => 
        country.name[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.name.en.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10); // Limit results for better performance
  }, [countries, searchTerm, language]);

  const handleCountrySelect = useCallback((country: Country) => {
    onCountrySelect(country);
    setIsOpen(false);
    setSearchTerm('');
  }, [onCountrySelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          style={{
            /* Performance optimizations */
            willChange: 'auto',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)'
          }}
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
        <button
          onClick={handleToggle}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-300 hover:text-white transition-colors"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50"
          style={{
            /* Performance optimizations */
            willChange: 'auto',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            contain: 'layout style paint'
          }}
        >
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-white"
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="font-medium">{country.name[language]}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-300 text-center">
              {searchTerm ? 'No countries found' : 'Type to search countries...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CountrySearch.displayName = 'CountrySearch';

export default CountrySearch;