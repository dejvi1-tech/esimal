import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface CountryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CountryInfoModal: React.FC<CountryInfoModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();

  const supportedCountries = {
    al: [
    'Shqipëri', 'Algjeri', 'Armeni', 'Australi', 'Austri', 'Azerbajxhan', 'Bahrein',
    'Bjellorusi', 'Belgjikë', 'Bosnjë dhe Hercegovinë', 'Brazil', 'Bullgari', 'Kanada',
    'Kroaci', 'Qipro', 'Republika Çeke', 'Danimarkë', 'Egjipt', 'Estoni', 'Ishujt Faroe',
    'Finlandë', 'Francë', 'Gjeorgji', 'Gjermani', 'Greqi', 'Hong Kong', 'Hungari',
    'Islandë', 'Indi', 'Indonezi', 'Irlandë', 'Izrael', 'Itali', 'Kazakistan', 'Kuvajt',
    'Kirgistan', 'Letoni', 'Lihtenshtajn', 'Lituani', 'Luksemburg', 'Makao Kinë',
    'Maqedoni', 'Malajzi', 'Maltë', 'Moldavi', 'Mal i Zi', 'Holandë', 'Zelandë e Re',
    'Norvegji', 'Oman', 'Pakistan', 'Filipine', 'Poloni', 'Portugali', 'Katar', 'Reunion',
    'Rumani', 'Federata Ruse', 'Serbi', 'Singapor', 'Sllovaki', 'Slloveni', 'Spanjë',
    'Sri Lanka', 'Suedi', 'Zvicër', 'Tajvan', 'Tajlandë', 'Tunizi', 'Turqi', 'Ukrainë',
    'Mbretëria e Bashkuar', 'Shtetet e Bashkuara', 'Uzbekistan', 'Vietnam'],

    en: [
    'Albania', 'Algeria', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahrain',
    'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Canada',
    'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Egypt', 'Estonia', 'Faroe Islands',
    'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Hong Kong', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Kazakhstan', 'Kuwait',
    'Kyrgyzstan', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao China',
    'Macedonia', 'Malaysia', 'Malta', 'Moldova', 'Montenegro', 'Netherlands', 'New Zealand',
    'Norway', 'Oman', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Reunion',
    'Romania', 'Russian Federation', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'Spain',
    'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand', 'Tunisia', 'Turkey', 'Ukraine',
    'United Kingdom', 'United States', 'Uzbekistan', 'Vietnam']

  };

  return (
    <AnimatePresence data-id="tgg6uhhlf" data-path="src/components/CountryInfoModal.tsx">
      {isOpen &&
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose} data-id="rzh9w9b87" data-path="src/components/CountryInfoModal.tsx">

          <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()} data-id="n0os24tdt" data-path="src/components/CountryInfoModal.tsx">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200" data-id="nadi873zg" data-path="src/components/CountryInfoModal.tsx">
              <h2 className="text-2xl font-bold text-gray-900" data-id="1o6ms7ske" data-path="src/components/CountryInfoModal.tsx">
                {t('what_includes_packages')}
              </h2>
              <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100" data-id="rq6tkd862" data-path="src/components/CountryInfoModal.tsx">

                <X className="w-6 h-6" data-id="5wx67mtv4" data-path="src/components/CountryInfoModal.tsx" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]" data-id="yw2n20vo8" data-path="src/components/CountryInfoModal.tsx">
              <div className="space-y-6" data-id="8mb7kt2a5" data-path="src/components/CountryInfoModal.tsx">
                <p className="text-gray-700 leading-relaxed" data-id="iuoias9nv" data-path="src/components/CountryInfoModal.tsx">
                  {t('data_only_description')}
                </p>

                <div data-id="okmkaueuk" data-path="src/components/CountryInfoModal.tsx">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4" data-id="n54uxcs8k" data-path="src/components/CountryInfoModal.tsx">
                    {t('supported_countries')}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm text-gray-600" data-id="70j56gqw7" data-path="src/components/CountryInfoModal.tsx">
                    {supportedCountries[language].map((country, index) =>
                  <div
                    key={index}
                    className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-100" data-id="xoxrhcbx8" data-path="src/components/CountryInfoModal.tsx">

                        {country}
                      </div>
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200" data-id="bh5vufdax" data-path="src/components/CountryInfoModal.tsx">
              <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" data-id="l6w8ksvr2" data-path="src/components/CountryInfoModal.tsx">

                {t('close')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

};

export default CountryInfoModal;