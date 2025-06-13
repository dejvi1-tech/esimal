import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const cardImages = [
  { src: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png', alt: 'Visa' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png', alt: 'Mastercard' },
];

const PaymentCardsSection: React.FC = () => {
  const { language } = useLanguage();
  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center md:justify-center gap-4 md:gap-6">
        <div className="flex-shrink-0 text-left md:mr-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-0 md:mb-0">
            {language === 'al' ? 'Paguaj sigurtë me kartelë' : 'Pay securely by card'}
          </h2>
        </div>
        <div className="flex flex-row gap-2 md:gap-4 items-center">
          {cardImages.map((img, idx) => (
            <div key={idx} className="w-24 h-14 flex items-center justify-center border rounded-lg bg-white shadow-sm p-2">
              <img src={img.src} alt={img.alt} className="max-h-10 max-w-[60px] object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PaymentCardsSection; 