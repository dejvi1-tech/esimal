import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LazyImage from './ui/LazyImage';

const cardImages = [
  { src: '/images/payment-cards/visa-logo.webp', alt: 'Visa' },
  { src: '/images/payment-cards/mastercard-logo.webp', alt: 'Mastercard' },
];

const PaymentCardsSection: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center md:justify-center gap-4 md:gap-6">
        <div className="flex-shrink-0 text-left md:mr-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-0 md:mb-0">
            {t('payment_cards_title')}
          </h2>
        </div>
        <div className="flex flex-row gap-2 md:gap-4 items-center">
          {cardImages.map((img, idx) => (
            <div key={idx} className="w-24 h-14 flex items-center justify-center rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 shadow-lg p-2">
              <LazyImage
                src={img.src}
                alt={img.alt}
                className="max-h-10 max-w-[60px] object-contain"
                priority={true}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PaymentCardsSection; 