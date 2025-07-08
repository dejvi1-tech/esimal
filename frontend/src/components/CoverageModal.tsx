import React from 'react';
import { X, MapPin, Wifi, Clock, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScrollLock } from '@/hooks/useScrollLock';

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
  
  // Use the scroll lock hook for safe scroll management
  const { forceRestoreScroll } = useScrollLock(isOpen);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
        onClick={onClose}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      
      {/* Modal Content */}
      <div 
        className="relative modal-glass rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '600px',
          width: '100%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">
            Europe Coverage
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Coverage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 glass-light rounded-xl">
              <Wifi className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{coverage.data}</div>
              <div className="text-sm text-white/70">Data Amount</div>
            </div>
            <div className="text-center p-4 glass-light rounded-xl">
              <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{coverage.validity}</div>
              <div className="text-sm text-white/70">Validity Period</div>
            </div>
            <div className="text-center p-4 glass-light rounded-xl">
              <Globe className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{coverage.speed}</div>
              <div className="text-sm text-white/70">Network Speed</div>
            </div>
          </div>

          {/* Countries List */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Covered Countries ({coverage.countries.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {coverage.countries.map((country, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 glass-light rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-white truncate">{country}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">
              Covered Regions
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
            className="w-full btn-glass bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold"
          >
                            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverageModal; 