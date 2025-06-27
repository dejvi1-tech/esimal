import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Wifi, Clock, Globe, ShoppingCart, Search } from 'lucide-react';
import { formatDataAmount } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchPackage {
  id: string;
  name: { [key: string]: string };
  country_name: { [key: string]: string };
  data_amount: number;
  validity_days: number;
  sale_price: number;
  reseller_id: string;
  region: string;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('country') || '');
  const [packages, setPackages] = useState<SearchPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buyingPackage, setBuyingPackage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const { t, language } = useLanguage();

  useEffect(() => {
    if (searchTerm) {
      searchPackages(searchTerm);
    }
  }, [searchTerm, language]);

  const searchPackages = async (country: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search-packages?country=${encodeURIComponent(country)}&lang=${language}`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      } else {
        setError(t('failed_to_search_packages'));
      }
    } catch (err) {
      setError(t('failed_to_search_packages'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ country: searchTerm.trim() });
      searchPackages(searchTerm.trim());
    }
  };

  const handleBuyPackage = async (pkg: SearchPackage) => {
    if (!userEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    setBuyingPackage(pkg.id);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: pkg.id,
          userEmail: userEmail.trim(),
          userName: userName.trim() || userEmail.trim()
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Order created successfully! QR code will be sent to ${userEmail}`);
        // Clear form
        setUserEmail('');
        setUserName('');
      } else {
        alert(`Failed to create order: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to create order. Please try again.');
    } finally {
      setBuyingPackage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('search_esim_packages')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('find_the_perfect_package')}
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t('enter_country_name_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              {t('search')}
            </Button>
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-xl">{t('searching_packages')}</div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-600">{t('error')}: {error}</div>
          </div>
        )}

        {!loading && !error && searchTerm && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('packages_for')} {searchTerm}
              </h2>
              <p className="text-gray-600">
                {packages.length} {t('package')}{packages.length !== 1 ? 's' : ''} {t('found')}
              </p>
            </div>

            {packages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">
                  {t('no_packages_found_for')} "{searchTerm}". {t('try_different_country')}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Package Name */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {pkg.name[language]}
                      </h3>

                      {/* Country */}
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          {pkg.country_name[language]}
                        </span>
                      </div>

                      {/* Package Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            {formatDataAmount(pkg.data_amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">
                            {pkg.validity_days} {t('days')}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-green-600">
                          €{pkg.sale_price.toFixed(2)}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mb-6 justify-center">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                          4G/5G
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          Instant
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                          {pkg.region}
                        </Badge>
                      </div>

                      {/* Email Input */}
                      <div className="space-y-3 mb-4">
                        <input
                          type="email"
                          placeholder="Your email address"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Your name (optional)"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Buy Button */}
                      <Button
                        onClick={() => handleBuyPackage(pkg)}
                        disabled={buyingPackage === pkg.id}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {buyingPackage === pkg.id ? 'Processing...' : 'Buy Now'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Search Yet */}
        {!loading && !error && !searchTerm && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              Enter a country name above to search for eSIM packages.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage; 