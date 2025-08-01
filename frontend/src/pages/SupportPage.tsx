import FAQSection from "@/components/FAQSection";
import { Helmet } from 'react-helmet-async';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SupportPage = () => {
  const { t } = useLanguage();
  
  // WhatsApp info
  const phoneNumber = '355698365533'; // Updated WhatsApp number
  const message = encodeURIComponent(t('whatsapp_message'));
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <>
      <Helmet>
        <title>Support | e-SimFly</title>
      </Helmet>
      <div className="pt-16">
        {/* WhatsApp Banner */}
        <div className="card-glass flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 mb-10 max-w-4xl mx-auto shadow-glow">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 bg-white/10 rounded-full p-3 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="18" fill="#25D366"/>
                <path fill="#fff" d="M26.1 21.7c-.4-.2-2.3-1.1-2.6-1.2-.3-.1-.5-.2-.7.2-.2.4-.7 1.2-.9 1.4-.2.2-.3.3-.7.1-.4-.2-1.5-.5-2.8-1.6-1-1-1.7-2.1-1.9-2.5-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.2-.4.3-.6.1-.2 0-.5 0-.7 0-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5-.2 0-.4 0-.6 0-.2 0-.5.1-.7.3-.2.2-.9.8-.9 2 0 1.2.9 2.3 1 2.5.1.2 1.7 2.7 4.1 3.7 1.6.7 2.2.8 2.6.7.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1.1-.1-.2-.3-.3-.7-.5z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg md:text-xl font-bold text-white mb-1">{t('support_whatsapp_title')}</div>
              <div className="text-gray-200 text-base md:text-lg font-medium truncate">{t('support_whatsapp_description')}</div>
            </div>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold text-lg shadow-lg transition-none w-full md:w-auto"
              style={{ minWidth: 170 }}
            >
              {t('support_chat_now')}
              <span className="ml-2 text-xl">→</span>
            </a>
          </div>
        </div>
        <FAQSection />
      </div>
    </>
  );
};

export default SupportPage;