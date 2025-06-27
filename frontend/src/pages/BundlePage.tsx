import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { europeanCountries } from '@/data/countries';
import { formatDataAmount } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

// Re-using the simple card from CountryPage for consistency
interface Package {
  id: string;
  name: string;
  country_name: string;
  data_amount: number;
  validity_days: number;
  sale_price: number;
}

const SimplePlanCard: React.FC<{
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
}> = ({ pkg, selected, onSelect }) => {
  const { t, language } = useLanguage();
  return (
    <div
      className={`flex flex-col justify-between p-4 bg-white rounded-xl shadow border transition-all cursor-pointer h-full ${selected ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'}`}
      onClick={onSelect}
      style={{ minHeight: '110px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-bold text-gray-900">{formatDataAmount(pkg.data_amount)}</div>
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'}`}>
          {selected && <span className="w-2 h-2 bg-white rounded-full block" />}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{pkg.validity_days} {t('days')}</span>
        <span className={`font-bold text-base ${selected ? 'text-purple-700' : 'text-gray-800'}`}>€{pkg.sale_price.toFixed(2)}</span>
      </div>
    </div>
  );
};

const BundlePage: React.FC = () => {
  const { bundleId } = useParams<{ bundleId: string }>();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bundleInfo, setBundleInfo] = useState<{name: string, flag: string} | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!bundleId) return;

    setLoading(true);
    // Fetch packages for the country specified in bundleId
    fetch(`${import.meta.env.VITE_API_URL}/api/search-packages?country=${encodeURIComponent(bundleId)}&lang=${language}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: Package[]) => {
        console.log('Raw packages from API:', data);
        
        // Deduplicate packages based on content (not just ID)
        const uniquePackages = data.filter((pkg, index, self) =>
          index === self.findIndex((p) => (
            p.data_amount === pkg.data_amount &&
            p.validity_days === pkg.validity_days &&
            p.sale_price === pkg.sale_price &&
            p.country_name === pkg.country_name
          ))
        );
        
        console.log('Deduplicated packages:', uniquePackages);
        setPackages(uniquePackages);
        if (uniquePackages.length > 0) {
          setSelectedId(uniquePackages[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(t('failed_to_fetch_packages'));
        setLoading(false);
      });
    
    // Get country info for display
    const countryObj = europeanCountries.find(c => c.code.toLowerCase() === bundleId.toLowerCase() || c.name.en.toLowerCase() === bundleId.toLowerCase());
    if (countryObj) {
      setBundleInfo({ name: countryObj.name[language], flag: countryObj.flag });
    } else {
        // Fallback for names not in the list like 'illyria'
        setBundleInfo({ name: t(`bundle_${bundleId}`) || (bundleId.charAt(0).toUpperCase() + bundleId.slice(1)), flag: '' });
    }

  }, [bundleId, language]);

  if (loading) {
    return <div className="text-center py-20">{t('loading')}</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-600">{error}</div>;
  }
  
  const pageTitle = bundleInfo ? `${bundleInfo.name} ${t('packages')}` : t('bundle_packages');

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center mb-8">
            {bundleInfo?.flag && <img src={bundleInfo.flag} alt={bundleInfo.name} className="w-20 h-14 rounded-lg shadow-md mb-4 object-cover" />}
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white">{bundleInfo?.name}</h1>
        </div>
        
        {packages.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">{t('no_packages_available')}</p>
        ) : (
          <div className="max-w-4xl mx-auto">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {packages.map(pkg => (
                <SimplePlanCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selectedId === pkg.id}
                  onSelect={() => setSelectedId(pkg.id)}
                />
              ))}
            </div>
             <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold py-3 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50"
              onClick={() => {
                if (selectedId) {
                  navigate(`/checkout?country=${bundleId}&package=${selectedId}`);
                }
              }}
              disabled={!selectedId}
            >
              {t('buy_now')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default BundlePage; 