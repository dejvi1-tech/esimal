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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative modal-glass rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">
            {t('coverage_modal_title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Coverage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 glass-light rounded-xl">
              <Wifi className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{coverage.data}</div>
              <div className="text-sm text-white/70">{t('coverage_data')}</div>
            </div>
            <div className="text-center p-4 glass-light rounded-xl">
              <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{coverage.validity}</div>
              <div className="text-sm text-white/70">{t('coverage_validity')}</div>
            </div>
            <div className="text-center p-4 glass-light rounded-xl">
              <Globe className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{coverage.speed}</div>
              <div className="text-sm text-white/70">{t('coverage_speed')}</div>
            </div>
          </div>

          {/* Countries List */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t('coverage_countries')} ({coverage.countries.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {coverage.countries.map((country, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 glass-light rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-white">{country}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">
              {t('coverage_regions')}
            </h3>
            <div className="space-y-2">
              {coverage.regions.map((region, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 glass-light rounded-lg"
                >
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span className="text-white">{region}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="w-full btn-glass bg-accent text-accent-foreground py-3 rounded-xl font-semibold transition-colors"
          >
            {t('coverage_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverageModal; 