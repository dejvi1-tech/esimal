import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { europeanCountries } from '@/data/countries';
import { formatDataAmount } from '@/utils/formatDataAmount';
import { countrySlug, decodeSlug, capitalize } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';

const planeBeachImage = '/pandahero.png';

// Function to get country code from country name
const getCountryCode = (countryName: string): string => {
  const countryMappings: { [key: string]: string } = {
    'United States': 'us',
    'United Kingdom': 'gb',
    'Germany': 'de',
    'France': 'fr',
    'Italy': 'it',
    'Spain': 'es',
    'Netherlands': 'nl',
    'Belgium': 'be',
    'Switzerland': 'ch',
    'Austria': 'at',
    'Denmark': 'dk',
    'Norway': 'no',
    'Sweden': 'se',
    'Finland': 'fi',
    'Poland': 'pl',
    'Czech Republic': 'cz',
    'Hungary': 'hu',
    'Romania': 'ro',
    'Bulgaria': 'bg',
    'Croatia': 'hr',
    'Slovenia': 'si',
    'Slovakia': 'sk',
    'Lithuania': 'lt',
    'Latvia': 'lv',
    'Estonia': 'ee',
    'Ireland': 'ie',
    'Portugal': 'pt',
    'Greece': 'gr',
    'Cyprus': 'cy',
    'Malta': 'mt',
    'Luxembourg': 'lu',
    'Iceland': 'is',
    'Albania': 'al',
    'Bosnia and Herzegovina': 'ba',
    'Serbia': 'rs',
    'Montenegro': 'me',
    'North Macedonia': 'mk',
    'Kosovo': 'xk',
    'Moldova': 'md',
    'Ukraine': 'ua',
    'Belarus': 'by',
    'Russia': 'ru',
    'Turkey': 'tr',
    'Dubai': 'ae',
    'United Arab Emirates': 'ae',
    'Saudi Arabia': 'sa',
    'Qatar': 'qa',
    'Kuwait': 'kw',
    'Bahrain': 'bh',
    'Oman': 'om',
    'Jordan': 'jo',
    'Lebanon': 'lb',
    'Israel': 'il',
    'Egypt': 'eg',
    'Morocco': 'ma',
    'Tunisia': 'tn',
    'Algeria': 'dz',
    'Libya': 'ly',
    'Sudan': 'sd',
    'South Africa': 'za',
    'Nigeria': 'ng',
    'Kenya': 'ke',
    'Ghana': 'gh',
    'Ethiopia': 'et',
    'Uganda': 'ug',
    'Tanzania': 'tz',
    'Rwanda': 'rw',
    'Burundi': 'bi',
    'Cameroon': 'cm',
    'Chad': 'td',
    'Niger': 'ne',
    'Mali': 'ml',
    'Burkina Faso': 'bf',
    'Senegal': 'sn',
    'Guinea': 'gn',
    'Sierra Leone': 'sl',
    'Liberia': 'lr',
    'Ivory Coast': 'ci',
    'Gambia': 'gm',
    'Guinea-Bissau': 'gw',
    'Cape Verde': 'cv',
    'Mauritania': 'mr',
    'Mauritius': 'mu',
    'Seychelles': 'sc',
    'Comoros': 'km',
    'Madagascar': 'mg',
    'Malawi': 'mw',
    'Zambia': 'zm',
    'Zimbabwe': 'zw',
    'Botswana': 'bw',
    'Namibia': 'na',
    'Lesotho': 'ls',
    'Eswatini': 'sz',
    'Mozambique': 'mz',
    'Angola': 'ao',
    'Democratic Republic of the Congo': 'cd',
    'Republic of the Congo': 'cg',
    'Central African Republic': 'cf',
    'Gabon': 'ga',
    'Equatorial Guinea': 'gq',
    'São Tomé and Príncipe': 'st',
    'China': 'cn',
    'Japan': 'jp',
    'South Korea': 'kr',
    'North Korea': 'kp',
    'Taiwan': 'tw',
    'Hong Kong': 'hk',
    'Macau': 'mo',
    'Mongolia': 'mn',
    'Vietnam': 'vn',
    'Laos': 'la',
    'Cambodia': 'kh',
    'Thailand': 'th',
    'Myanmar': 'mm',
    'Malaysia': 'my',
    'Singapore': 'sg',
    'Indonesia': 'id',
    'Philippines': 'ph',
    'Brunei': 'bn',
    'East Timor': 'tl',
    'Papua New Guinea': 'pg',
    'Australia': 'au',
    'New Zealand': 'nz',
    'Fiji': 'fj',
    'Vanuatu': 'vu',
    'New Caledonia': 'nc',
    'Solomon Islands': 'sb',
    'Kiribati': 'ki',
    'Tuvalu': 'tv',
    'Nauru': 'nr',
    'Palau': 'pw',
    'Micronesia': 'fm',
    'Marshall Islands': 'mh',
    'Samoa': 'ws',
    'Tonga': 'to',
    'Cook Islands': 'ck',
    'Niue': 'nu',
    'Tokelau': 'tk',
    'American Samoa': 'as',
    'Guam': 'gu',
    'Northern Mariana Islands': 'mp',
    'Canada': 'ca',
    'Mexico': 'mx',
    'Brazil': 'br',
    'Argentina': 'ar',
    'Chile': 'cl',
    'Peru': 'pe',
    'Colombia': 'co',
    'Venezuela': 've',
    'Ecuador': 'ec',
    'Bolivia': 'bo',
    'Paraguay': 'py',
    'Uruguay': 'uy',
    'Guyana': 'gy',
    'Suriname': 'sr',
    'French Guiana': 'gf',
    'Falkland Islands': 'fk',
    'South Georgia': 'gs',
    'Antarctica': 'aq',
    'Europe': 'eu'
  };
  
  return countryMappings[countryName] || 'un';
};

interface Package {
  id: string;
  name: string;
  country_name: string;
  data_amount: number;
  days: number;
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
        <span>{pkg.days} {t('days')}</span>
        <span className={`font-bold text-base ${selected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200'}`}>
          €{typeof pkg.sale_price === 'number' && !isNaN(pkg.sale_price) ? pkg.sale_price.toFixed(2) : '0.00'}
        </span>
      </div>
    </div>
  );
};

// Minimal ErrorBanner component
const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
    <h2 className="text-3xl font-bold mb-4 text-red-500">Error</h2>
    <p className="text-gray-700 dark:text-gray-300">{message}</p>
  </div>
);

// Minimal EmptyState component
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
    <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">No Packages</h2>
    <p className="text-gray-700 dark:text-gray-300 text-lg">{message}</p>
  </div>
);

const CountryPage: React.FC = () => {
  console.log("CountryPage mounted");
  const { slug } = useParams<{ slug: string }>();
  console.log("slug param:", slug);
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string>('');
  const [countryFlag, setCountryFlag] = useState<string>('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setIsError(false);
    setPackages([]);
    setSelectedId(null);
    setCountryName('');
    setCountryFlag('');

    const fetchPackages = async () => {
      try {
        console.debug('[CountryPage] slug:', slug);
        const apiUrl = `/api/packages/get-section-packages?slug=${slug}`;
        console.debug('[CountryPage] Fetching:', apiUrl);
        const response = await fetch(apiUrl);
        console.debug('[CountryPage] Response status:', response.status);
        const data = await response.json();
        console.debug('[CountryPage] Data received:', data);
        if (Array.isArray(data) && data.length > 0) {
          setPackages(data);
          setSelectedId(data[0]?.id || null);
          setCountryName(decodeSlug(slug));
          setCountryFlag('');
          setLoading(false);
          return;
        }
        console.warn(`[CountryPage] No packages found for slug: ${slug}`, { slug, apiUrl, response, data });
        setPackages([]);
        setLoading(false);
      } catch (e) {
        console.error('[CountryPage] Error fetching packages:', e);
        setIsError(true);
        setLoading(false);
      }
    };
    fetchPackages();
  }, [slug, language]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mb-4"></div>
        <div className="text-xl text-gray-800 dark:text-gray-200">Loading packages...</div>
      </div>
    );
  }

  if (isError) return <ErrorBanner message="Couldn't load packages." />;
  if (packages.length === 0) return <EmptyState message={`No offers for \"${slug}\"`} />;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left: Photo */}
        <div className="flex flex-col items-start w-full h-full mt-0 md:mt-16">
          {/* Panda Image */}
          <div className="bg-white/90 rounded-3xl shadow-2xl border border-gray-100 max-w-lg md:max-w-xl w-full mx-auto flex items-center justify-center overflow-hidden" style={{ aspectRatio: '3/4', minHeight: '420px', maxHeight: '600px' }}>
            <picture>
              <source srcSet="/heropanda7.webp" type="image/webp" />
              <img
                src="/heropanda7.png"
                alt="e-SimFly Hero Panda"
                className="w-full h-full object-cover"
                style={{ objectFit: 'cover', height: '100%', width: '100%' }}
              />
            </picture>
          </div>
        </div>
        {/* Right: Plan Cards and Info */}
        <div>
          {/* Country Title with Flag - positioned above packages */}
          <div className="flex items-center mb-6" style={{ marginTop: '32px' }}>
            <img 
              src={`https://hatscripts.github.io/circle-flags/flags/${getCountryCode(countryName)}.svg`}
              alt={`${countryName} flag`}
              className="w-6 h-6 rounded-full object-cover"
              style={{
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                objectFit: 'cover'
              }}
            />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 ml-2">{countryName}</h1>
          </div>
          
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
                  navigate(`/checkout?country=${slug}&package=${selectedId}`);
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