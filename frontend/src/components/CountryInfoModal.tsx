import React from 'react';
import { X, MapPin, Wifi, Clock, Globe, Star, Users, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Country } from '@/data/countries';
import { useScrollLock } from '@/hooks/useScrollLock';

interface CountryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: Country | null;
}

const CountryInfoModal: React.FC<CountryInfoModalProps> = ({ isOpen, onClose, country }) => {
  const { t, language } = useLanguage();
  
  // Use the scroll lock hook for safe scroll management
  useScrollLock(isOpen);

  if (!isOpen || !country) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{country.flag}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {country.name[language]}
              </h2>
              <p className="text-sm text-gray-500">{country.region}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Country Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Wifi className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">4G/5G</div>
              <div className="text-sm text-gray-600">{t('country_network')}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">99%</div>
              <div className="text-sm text-gray-600">{t('country_coverage')}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">4.8</div>
              <div className="text-sm text-gray-600">{t('country_rating')}</div>
            </div>
          </div>

          {/* Available Packages */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {t('country_available_packages')}
            </h3>
            <div className="space-y-3">
              {country.packages?.slice(0, 3).map((pkg, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{pkg.name[language]}</div>
                      <div className="text-sm text-gray-600">{pkg.validity[language]}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{pkg.price}</div>
                    <div className="text-sm text-gray-600">{pkg.data[language]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coverage Details */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t('country_coverage_details')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">{t('country_national_coverage')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Wifi className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">{t('country_high_speed')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">{t('country_instant_activation')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('country_view_packages')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountryInfoModal;