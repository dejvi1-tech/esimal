import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, Clock, Globe, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDataAmount } from '@/lib/utils';

interface MyPackage {
  id: string;
  name: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  sale_price: number;
  reseller_id: string;
}

const MyPackagesSection: React.FC = () => {
  const [packages, setPackages] = useState<MyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyingPackage, setBuyingPackage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/frontend-packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      } else {
        setError('Failed to fetch packages');
      }
    } catch (err) {
      setError('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPackage = async (pkg: MyPackage) => {
    if (!userEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    setBuyingPackage(pkg.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/my-packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

  if (loading) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-xl">Loading packages...</div>
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
    <section className="relative overflow-hidden py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Available eSIM Packages
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Choose from our curated selection of eSIM packages for your travel needs
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl">
              No packages available at the moment. Please check back later.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="relative group p-[1px] bg-gradient-to-br from-purple-400 via-blue-300 to-pink-300 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center relative">
                  {/* Package Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                    {pkg.name}
                  </h3>
                  
                  {/* Country */}
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">{pkg.country_name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white text-2xl font-bold px-6 py-2 rounded-full shadow">
                      ${pkg.sale_price.toFixed(2)}
                    </span>
                  </div>

                  {/* Data & Validity */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Wifi className="w-4 h-4 text-blue-500" />
                      <span className="text-lg font-bold text-gray-900">
                        {formatDataAmount(Number(pkg.data_amount))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">{pkg.validity_days} days</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      4G/5G
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Instant Activation
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      Global Coverage
                    </Badge>
                  </div>

                  {/* Email Input */}
                  <div className="w-full space-y-3 mb-4">
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
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-bold text-base shadow transition-all flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {buyingPackage === pkg.id ? 'Processing...' : 'Buy Now'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 max-w-4xl mx-auto">
            <h4 className="text-xl font-bold text-gray-900 mb-4">
              Why Choose Our eSIM Packages?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Wifi className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium">Lightning Fast</p>
                <p className="text-xs">High-speed networks worldwide</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium">Instant Activation</p>
                <p className="text-xs">Get connected immediately</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-medium">Global Coverage</p>
                <p className="text-xs">Works in multiple countries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyPackagesSection; 