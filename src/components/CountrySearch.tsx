import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Info } from 'lucide-react';
import { europeanCountries, Country } from '@/data/countries';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface CountrySearchProps {
  onCountrySelect: (country: Country) => void;
  selectedCountry?: Country | null;
  forceOpen?: boolean;
}

const CountrySearch: React.FC<CountrySearchProps> = ({ onCountrySelect, selectedCountry, forceOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const EU_COUNTRY: Country = {
    code: 'EU',
    name: { al: 'Europë', en: 'Europe' },
    flag: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg',
    region: 'Europe',
    packages: europeanCountries[0]?.packages || []
  };

  const mostPopularCodes = ['IT', 'DE', 'GR', 'ES'];
  const mostPopularCountries = europeanCountries.filter(c => mostPopularCodes.includes(c.code));
  const restCountries = europeanCountries.filter(c => !mostPopularCodes.includes(c.code));
  const baseList = [EU_COUNTRY, ...mostPopularCountries, ...restCountries];
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
    navigate(`/country/${country.code}`);
  };

  React.useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  return (
    <>
      {/* Trigger Input (remains visible, but opens modal) */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={language === 'al' ? 'Zgjidh ose kërko një shtet...' : 'Type or search a country...'}
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-blue-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-full focus:outline-none bg-white shadow-md placeholder-gray-400 placeholder:font-semibold placeholder:text-base transition-all duration-200"
            aria-label={language === 'al' ? 'Kërko shtet' : 'Search country'}
            readOnly // Make input readonly to always open modal on click
            onClick={() => setIsOpen(true)}
          />
        </div>
      </div>

      {/* Modal Popup */}
      {(isOpen || forceOpen) && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setIsOpen(false)} />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full mx-2 p-4 sm:p-6 relative flex flex-col max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Content: Search Input and Close Button on the same line */}
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    placeholder={language === 'al' ? 'Zgjidh ose kërko një shtet...' : 'Type or search a country...'}
                    className="w-full pl-10 pr-10 py-2 text-base border-2 border-blue-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-full focus:outline-none bg-white shadow-md placeholder-gray-400 placeholder:font-semibold placeholder:text-sm transition-all duration-200"
                    aria-label={language === 'al' ? 'Kërko shtet' : 'Search country'}
                  />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center">
                    <div className="group relative focus-within:ring-2 focus-within:ring-purple-400">
                      <button
                        tabIndex={0}
                        aria-label={language === 'al' ? 'Informacion për kërkimin' : 'Country search info'}
                        className="text-blue-400 hover:text-purple-600 focus:outline-none focus:text-purple-700 rounded-full p-1 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 hidden group-hover:block group-focus-within:block min-w-max bg-white text-gray-800 text-xs rounded-lg shadow-lg px-4 py-2 border border-gray-200">
                        {language === 'al'
                          ? 'Kërko ose zgjidh një shtet për të parë paketat e disponueshme.'
                          : 'Search or select a country to see available packages.'}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {/* Close Button on the same line */}
                <button
                  className="ml-2 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors text-2xl font-extrabold focus:outline-none shadow-sm z-50"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <span className="mt-[-2px]">×</span>
                </button>
              </div>
              {/* Info Text for Customers */}
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-2">
                {t('european_packages_info')}
              </div>
              {/* Most searched packages (EU and popular) */}
              <div className="mb-2 text-gray-500 font-semibold text-sm">Most searched packages</div>
              <div>
                {filteredCountries.length > 0 ?
                  <div>
                    {filteredCountries.map((country, idx) =>
                      <button
                        key={country.code}
                        onClick={() => handleCountrySelect(country)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={country.flag}
                            alt={country.name[language]}
                            className="w-8 h-8 object-cover rounded-full border border-gray-200"
                          />
                          <span className="font-medium text-gray-900 text-lg">
                            {country.name[language]}
                          </span>
                          {country.code === 'EU' && (
                            <span className="ml-2 bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-0.5 rounded-full">Most Popular</span>
                          )}
                          {mostPopularCodes.includes(country.code) && country.code !== 'EU' && (
                            <span className="ml-2 bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-0.5 rounded-full">Most Popular</span>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                  :
                  <div className="py-4 px-4 text-center text-gray-500">
                    No countries found
                  </div>
                }
              </div>
            </motion.div>
          </div>
        </>
      )}
      {/* Selected Country Display (below input, not in modal) */}
      {selectedCountry && !isOpen &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <img
              src={selectedCountry.flag}
              alt={selectedCountry.name[language]}
              className="w-8 h-6 object-cover rounded" />
            <span className="font-semibold text-blue-800">
              {selectedCountry.name[language]}
            </span>
          </div>
        </motion.div>
      }
    </>
  );
};

export default CountrySearch;