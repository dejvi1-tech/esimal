import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { europeanCountries } from '@/data/countries';
import { formatDataAmount } from '@/lib/utils';

const planeBeachImage = '/static/esimfly-plane-beach.jpg';

interface Package {
  id: string;
  name: string;
  country_name: string;
  data_amount: number;
  validity_days: number;
  sale_price: number;
  region?: string;
}

const SimplePlanCard: React.FC<{
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
}> = ({ pkg, selected, onSelect }) => {
  const { t, language } = useLanguage();
  return (
    <div
      className={`flex flex-col justify-between p-4 bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border rounded-xl shadow-lg transition-all cursor-pointer h-full min-w-0 ${selected ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-white/20 hover:border-purple-500/50'}`}
      onClick={onSelect}
      style={{ minHeight: '110px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{formatDataAmount(pkg.data_amount)}</div>
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-purple-500 bg-purple-500' : 'border-gray-400 dark:border-gray-600 bg-transparent'}`}>
          {selected && <span className="w-2 h-2 bg-white rounded-full block" />}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
        <span>{pkg.validity_days} {t('days')}</span>
        <span className={`font-bold text-base ${selected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200'}`}>€{pkg.sale_price.toFixed(2)}</span>
      </div>
    </div>
  );
};

const CountryPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string>('');
  const [countryFlag, setCountryFlag] = useState<string>('');

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError('');
    fetch(`${import.meta.env.VITE_API_URL}/api/search-packages?country=${encodeURIComponent(code)}&lang=${language}`)
      .then(res => res.json())
      .then((data: Package[]) => {
        const uniquePackages = data.filter((pkg, index, self) =>
          index === self.findIndex((p) => (
            p.data_amount === pkg.data_amount &&
            p.validity_days === pkg.validity_days &&
            p.sale_price === pkg.sale_price &&
            p.country_name === pkg.country_name
          ))
        );
        setPackages(uniquePackages);
        setSelectedId(uniquePackages[0]?.id || null);
        setLoading(false);
        const countryObj = europeanCountries.find(c => c.code === code);
        setCountryName(countryObj ? countryObj.name[language] : code.toUpperCase());
        setCountryFlag(countryObj ? countryObj.flag : '');
      })
      .catch(() => {
        setError(t('failed_to_fetch_packages'));
        setLoading(false);
      });
  }, [code, language]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mb-4"></div>
        <div className="text-xl text-gray-800 dark:text-gray-200">Loading packages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-3xl font-bold mb-4 text-red-500">Error</h2>
        <p className="text-gray-700 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">{countryName}</h2>
        <p className="text-gray-700 dark:text-gray-300 text-lg">{t('no_packages_available')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center mb-8 mt-12">
        {countryFlag && <img src={countryFlag} alt={countryName} className="w-20 h-14 rounded shadow mb-4" />}
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">{countryName}</h1>
      </div>
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left: Photo */}
        <div className="flex justify-center items-start w-full h-full mt-0 md:-mt-8">
          <img
            src={planeBeachImage}
            alt="e-SimFly airplane on beach"
            className="rounded-2xl shadow-lg w-full max-w-lg md:max-w-xl aspect-square object-cover object-center border border-white/10"
            style={{ minHeight: '300px', maxHeight: '500px' }}
          />
        </div>
        {/* Right: Plan Cards and Info */}
        <div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {packages.map(pkg => (
              <SimplePlanCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedId === pkg.id}
                onSelect={() => setSelectedId(pkg.id)}
              />
            ))}
          </div>
          {/* Buy Button above info text */}
          <div className="max-w-xl mx-auto">
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white text-lg font-bold py-3 rounded-full shadow-lg transition-all duration-200 mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ letterSpacing: '0.03em' }}
              onClick={() => {
                if (selectedId) {
                  navigate(`/checkout?country=${code}&package=${selectedId}`);
                }
              }}
              disabled={!selectedId}
            >
              {t('buy_now')}
            </button>
            <div className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-xl p-5 text-gray-800 dark:text-gray-200 text-base shadow-lg">
              <ul className="list-disc pl-5 space-y-2">
                <li>Mos u shqetëso nëse ke ndonjë problem me aktivizimin – ose e rregullojmë menjëherë, ose të kthejmë paratë. Pa stres, rimbursim i plotë! 😊</li>
                <li>Zgjidh planin që të shkon më shumë dhe aktivizoje kur të duash – nuk ka afat skadimi, ai të pret derisa të jesh gati.</li>
                <li>Pagesa është super e lehtë dhe e sigurt – përdorim vetëm platformat më të besueshme, kështu që je gjithmonë i mbrojtur.</li>
                <li>Dhe po, jemi këtu për ty 24/7! Na shkruaj kur të kesh pyetje apo ndonjë problem – përgjigjemi shpejt dhe me kënaqësi.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryPage; 