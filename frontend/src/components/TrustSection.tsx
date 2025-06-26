import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from "@/contexts/LanguageContext";

const badges = [
  {
    label: {
      al: 'Në Pajtim me PCI',
      en: 'PCI Compliant'
    },
    svg: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#E6E6FA"/><path d="M12 24l8 8 16-16" stroke="#7B2FF2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    label: {
      al: 'Pagesë e Sigurt',
      en: 'Secure Payment'
    },
    svg: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#E6E6FA"/><path d="M24 32a8 8 0 100-16 8 8 0 000 16z" stroke="#7B2FF2" strokeWidth="4"/><path d="M24 16v-4m0 20v-4" stroke="#7B2FF2" strokeWidth="4" strokeLinecap="round"/></svg>
    ),
  },
];

const partners = [
  { name: 'Visa', svg: <svg className="w-16 h-8" viewBox="0 0 64 32"><rect width="64" height="32" rx="6" fill="#fff"/><text x="50%" y="60%" textAnchor="middle" fill="#1A1F71" fontSize="18" fontWeight="bold" fontFamily="Arial">VISA</text></svg> },
  { name: 'Mastercard', svg: <svg className="w-16 h-8" viewBox="0 0 64 32"><rect width="64" height="32" rx="6" fill="#fff"/><circle cx="24" cy="16" r="10" fill="#EB001B"/><circle cx="40" cy="16" r="10" fill="#F79E1B" fillOpacity="0.8"/><text x="50%" y="60%" textAnchor="middle" fill="#222" fontSize="12" fontWeight="bold" fontFamily="Arial">MC</text></svg> },
  { name: 'Stripe', svg: <svg className="w-16 h-8" viewBox="0 0 64 32"><rect width="64" height="32" rx="6" fill="#fff"/><text x="50%" y="60%" textAnchor="middle" fill="#635BFF" fontSize="16" fontWeight="bold" fontFamily="Arial">Stripe</text></svg> },
];

const TrustSection: React.FC = () => {
  const { t, language } = useLanguage();
  
  return (
    <section className="py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="flex flex-col items-center md:items-start gap-4 flex-1">
          <div className="flex gap-6 mb-2">
            {badges.map((b, i) => (
              <div key={i} className="flex flex-col items-center">
                {b.svg}
                <span className="text-xs text-gray-700 dark:text-gray-300 mt-1">{b.label[language]}</span>
              </div>
            ))}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-2">{t('payment_protected')}</div>
        </div>
        <div className="flex-1 flex flex-col items-center md:items-end gap-2">
          <div className="flex gap-6">
            {partners.map((p, i) => (
              <div key={i} className="flex flex-col items-center">
                {p.svg}
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="text-gray-500 dark:text-gray-500 text-xs mt-2">{t('trusted_partners')}</div>
        </div>
      </motion.div>
    </section>
  );
};

export default TrustSection; 