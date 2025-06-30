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
  const { t } = useLanguage();
  return (
    <div
      className={`card-glass flex flex-col justify-between p-4 rounded-2xl text-white cursor-pointer h-full border-2 ${selected ? 'border-accent' : 'border-transparent'}`}
      onClick={onSelect}
      style={{ minHeight: '110px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xl font-semibold text-white">{formatDataAmount(pkg.data_amount)}</div>
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-accent bg-accent' : 'border-gray-300 bg-white/10'}`}> 
          {selected && <span className="w-2 h-2 bg-white rounded-full block" />}
        </span>
      </div>
      <div className="flex items-center justify-between text-base text-gray-300">
        <span>{pkg.validity_days} {t('days')}</span>
        <span className="font-bold text-lg text-white">€{pkg.sale_price.toFixed(2)}</span>
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
    // Fetch the specific package by ID since bundleId is actually a package ID
    fetch(`${import.meta.env.VITE_API_URL}/api/packages/get-section-packages?slug=most-popular`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: Package[]) => {
        console.log('Raw packages from API:', data);
        
        // Find the specific package by ID
        const specificPackage = data.find(pkg => pkg.id === bundleId);
        
        if (specificPackage) {
          // Create a packages array with just this package
          setPackages([specificPackage]);
          setSelectedId(specificPackage.id);
        } else {
          // If specific package not found, show all packages as fallback
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
        }
        setLoading(false);
      })
      .catch(() => {
        setError(t('failed_to_fetch_packages'));
        setLoading(false);
      });
    
    // Get country info for display - use the package's country info
    const countryObj = europeanCountries.find(c => c.code.toLowerCase() === 'eu' || c.name.en.toLowerCase() === 'europe');
    if (countryObj) {
      setBundleInfo({ name: countryObj.name[language], flag: countryObj.flag });
    } else {
        // Fallback for names not in the list
        setBundleInfo({ name: t(`bundle_${bundleId}`) || 'Europe Package', flag: '' });
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

      <div className="glass-medium p-6 md:p-10 rounded-2xl mx-auto max-w-7xl text-white mt-10">
        <div className="flex flex-col items-center mb-8">
          {bundleInfo?.flag && (
            <img src={bundleInfo.flag} alt={bundleInfo.name} className="w-20 h-14 rounded-lg shadow-md mb-4 object-cover" />
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{bundleInfo?.name} {t('bundles')}</h1>
          <p className="text-gray-300 text-lg mb-8">{t('choose_your_data_plan_below') || 'Choose your data plan below'}</p>
        </div>
        {packages.length === 0 ? (
          <p className="text-center text-gray-300 text-lg">{t('no_packages_available')}</p>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-8">
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
              className="btn-glass bg-accent text-black w-full py-2 rounded-xl font-bold text-lg min-h-[48px] mt-2"
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