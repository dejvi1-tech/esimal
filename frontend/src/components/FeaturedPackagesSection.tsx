import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, Clock, Globe, ShoppingCart } from 'lucide-react';
import { formatDataAmount } from '@/lib/utils';

interface FeaturedPackage {
  id: string;
  name: string;
  country_name: string;
  data_amount: number;
  validity_days: number;
  sale_price: number;
  reseller_id: string;
  region: string;
}

const FeaturedPackagesSection: React.FC = () => {
  const [packages, setPackages] = useState<FeaturedPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedPackages();
  }, []);

  const fetchFeaturedPackages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/featured-packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      } else {
        setError('Failed to fetch featured packages');
      }
    } catch (err) {
      setError('Failed to fetch featured packages');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPackage = async (pkg: FeaturedPackage) => {
    // Redirect to search page with the country pre-filled
    window.location.href = `/search?country=${encodeURIComponent(pkg.country_name)}`;
  };

  if (loading) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-xl">Loading featured packages...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured European eSIM Packages
          </h2>
          <p className="text-xl text-gray-600">
            Discover the best deals for your European travels
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              No featured packages available. Check back soon!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  {/* Country Flag/Name */}
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pkg.country_name}
                    </h3>
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
                        {pkg.validity_days} days
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-green-600">
                      €{typeof pkg.sale_price === 'number' && !isNaN(pkg.sale_price) ? pkg.sale_price.toFixed(2) : '0.00'}
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
                  </div>

                  {/* View All Button */}
                  <Button
                    onClick={() => handleBuyPackage(pkg)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    View All Packages
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Don't see your destination? Search for more countries and packages!
          </p>
          <Button
            onClick={() => window.location.href = '/search'}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Search All Destinations
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPackagesSection; 