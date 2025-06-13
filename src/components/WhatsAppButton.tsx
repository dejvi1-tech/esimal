import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const WhatsAppButton: React.FC = () => {
  const { t } = useLanguage();

  const handleWhatsAppClick = () => {
    const phoneNumber = '+1234567890'; // Replace with actual WhatsApp number
    const message = encodeURIComponent(t('whatsapp_message'));
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: 2,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="fixed bottom-6 right-6 z-50" data-id="7qfkrsw5h" data-path="src/components/WhatsAppButton.tsx">

      <motion.button
        onClick={handleWhatsAppClick}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={t('contact_whatsapp')} data-id="qq89ochms" data-path="src/components/WhatsAppButton.tsx">

        <MessageCircle className="w-6 h-6" data-id="5bhfu0bof" data-path="src/components/WhatsAppButton.tsx" />
        <span className="hidden md:block text-sm font-medium" data-id="8ondqkvfg" data-path="src/components/WhatsAppButton.tsx">
          {t('contact_whatsapp')}
        </span>
      </motion.button>
    </motion.div>);

};

export default WhatsAppButton;