import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { europeanCountries } from '@/data/countries';
import { useLanguage } from '@/contexts/LanguageContext';

const PackagesPage: React.FC = () => {
  const { language } = useLanguage();
  // Dedupe by country code (if needed)
  const uniqueCountries = europeanCountries.filter((country, idx, arr) =>
    arr.findIndex(c => c.code === country.code) === idx
  );
  return (
    <>
      <Helmet>
        <title>eSIM Packages - Global Coverage</title>
        <meta name="description" content="Browse our wide selection of eSIM packages for global connectivity. Find the perfect plan for your travel needs." />
      </Helmet>
      <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Available Countries</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {uniqueCountries.map(country => (
              <Link
                key={country.code}
                to={`/country/${country.code.toLowerCase()}`}
                className="flex flex-col items-center p-4 bg-white/80 rounded-xl shadow hover:shadow-lg transition border border-gray-200 hover:border-blue-400"
              >
                <img src={country.flag} alt={country.name[language]} className="w-16 h-12 rounded mb-2 object-cover" />
                <span className="text-lg font-semibold text-gray-800">{country.name[language]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PackagesPage; 