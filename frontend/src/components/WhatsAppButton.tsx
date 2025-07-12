import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const WhatsAppButton: React.FC = () => {
  const { t } = useLanguage();

  const handleWhatsAppClick = () => {
    const phoneNumber = '355698365533'; // Updated WhatsApp number, no plus sign
    const message = encodeURIComponent(t('whatsapp_message'));
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleWhatsAppClick}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2"
        title={t('contact_whatsapp')}>
        <MessageCircle className="w-6 h-6" />
        <span className="hidden md:block text-sm font-medium">
          {t('contact_whatsapp')}
        </span>
      </button>
    </div>);

};

export default WhatsAppButton;