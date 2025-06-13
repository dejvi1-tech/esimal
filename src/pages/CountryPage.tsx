import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { europeanCountries, Country, Package } from '@/data/countries';
import { useLanguage } from '@/contexts/LanguageContext';

const planeBeachImage = '/static/esimfly-plane-beach.jpg';

const SimplePlanCard: React.FC<{
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
}> = ({ pkg, selected, onSelect }) => (
  <div
    className={`flex flex-col justify-between p-4 bg-white rounded-xl shadow border transition-all cursor-pointer h-full min-w-0 ${selected ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'}`}
    onClick={onSelect}
    style={{ minHeight: '110px' }}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="text-base font-bold text-gray-900">{pkg.data}</div>
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'}`}>
        {selected && <span className="w-2 h-2 bg-white rounded-full block" />}
      </span>
    </div>
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span>{pkg.validity}</span>
      <span className={`font-bold text-sm ${selected ? 'text-purple-700' : 'text-gray-800'}`}>{pkg.price}</span>
    </div>
  </div>
);

const CountryPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  let country: Country | undefined = europeanCountries.find(c => c.code.toLowerCase() === code?.toLowerCase());
  // If code is 'EU', create a synthetic Europe country object (like in CountrySearch)
  if (!country && code?.toUpperCase() === 'EU') {
    country = {
      code: 'EU',
      name: { al: 'Europë', en: 'Europe' },
      flag: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg',
      region: 'Europe',
      packages: europeanCountries[0]?.packages || []
    };
  }
  const [selectedId, setSelectedId] = useState<string | null>(country?.packages[0]?.id || null);

  if (!country) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-3xl font-bold mb-4 text-red-600">Country Not Found</h2>
        <p className="text-gray-600">We couldn't find the country you're looking for.</p>
      </div>
    );
  }

  // Determine which packages to show
  const isEurope = country.code === 'EU';
  const displayedPackages = isEurope ? country.packages : country.packages.slice(0, 6);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center mb-8 mt-12">
        <img src={country.flag} alt={country.name[language]} className="w-20 h-14 rounded shadow mb-4" />
        <h1 className="text-4xl font-bold text-blue-800 mb-4">{country.name[language]}</h1>
      </div>
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left: Photo */}
        <div className="flex justify-center items-start w-full h-full mt-0 md:-mt-8">
          <img
            src={planeBeachImage}
            alt="e-SimFly airplane on beach"
            className="rounded-2xl shadow-lg w-full max-w-lg md:max-w-xl aspect-square object-cover object-center"
            style={{ minHeight: '300px', maxHeight: '500px' }}
          />
        </div>
        {/* Right: Plan Cards and Info */}
        <div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {displayedPackages.map(pkg => (
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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold py-3 rounded-full shadow transition-all duration-200 mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ letterSpacing: '0.03em' }}
              onClick={() => {
                if (selectedId && country) {
                  navigate(`/checkout?country=${country.code}&package=${selectedId}`);
                }
              }}
              disabled={!selectedId}
            >
              BLEJ TANI
            </button>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-purple-900 text-base shadow">
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