import React from 'react';
import { X, MapPin, Wifi, Clock, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverage: {
    countries: string[];
    regions: string[];
    data: string;
    validity: string;
    speed: string;
  };
}

const CoverageModal: React.FC<CoverageModalProps> = ({ isOpen, onClose, coverage }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('coverage_modal_title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Coverage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Wifi className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{coverage.data}</div>
              <div className="text-sm text-gray-600">{t('coverage_data')}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{coverage.validity}</div>
              <div className="text-sm text-gray-600">{t('coverage_validity')}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Globe className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{coverage.speed}</div>
              <div className="text-sm text-gray-600">{t('coverage_speed')}</div>
            </div>
          </div>

          {/* Countries List */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t('coverage_countries')} ({coverage.countries.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {coverage.countries.map((country, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{country}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {t('coverage_regions')}
            </h3>
            <div className="space-y-2">
              {coverage.regions.map((region, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">{region}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('coverage_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverageModal; 