import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { europeanCountries } from '@/data/countries';
import { useLanguage } from '@/contexts/LanguageContext';
import { countrySlug } from '../lib/utils';

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
      <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-purple-200 via-white to-purple-100">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-center text-white drop-shadow-lg">Available Countries</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {uniqueCountries.map(country => (
              <Link
                key={country.code}
                to={`/country/${countrySlug(country.name.en)}`}
                className="flex flex-col items-center justify-center bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-purple-200/60 transition-transform hover:scale-105 hover:shadow-2xl cursor-pointer"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white shadow-inner mb-4">
                  <img src={country.flag} alt={country.name[language]} className="w-12 h-12 object-contain rounded-full" />
                </div>
                <span className="text-lg font-bold text-black text-center drop-shadow-md">{country.name[language]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PackagesPage; 