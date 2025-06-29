import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WhatsAppSupportProps {
  phoneNumber: string;
  defaultMessage?: string;
}

const WhatsAppSupport: React.FC<WhatsAppSupportProps> = ({ 
  phoneNumber,
  defaultMessage = "Hello! I need help with eSIM."
}) => {
  const { t, language } = useLanguage();

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(language === 'al' ? 
      "Përshëndetje! Kam nevojë për ndihmë me eSIM." : 
      defaultMessage
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleWhatsAppClick}
        className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 border border-green-400/20"
        title={t('contact_whatsapp')}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden md:block text-sm font-medium bg-white/10 px-2 py-1 rounded-full">
          {t('contact_whatsapp')}
        </span>
      </button>
    </div>
  );
};

export default WhatsAppSupport; 