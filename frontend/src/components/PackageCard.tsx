import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Clock, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface PackageCardProps {
  title: string;
  price: string;
  data: string;
  validity: string;
  coverage: string;
  isPopular?: boolean;
  delay?: number;
  flagUrl?: string;
  countryCode?: string;
  packageId?: string;
  bonusData?: string;
  isOffer?: boolean;
  description?: string;
  specialFeatures?: string[];
}

const EU_FLAG = 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg';

const PackageCard = ({
  title,
  price,
  data,
  validity,
  coverage,
  isPopular = false,
  delay = 0,
  flagUrl,
  countryCode,
  packageId,
  bonusData,
  isOffer = false,
  description,
  specialFeatures
}: PackageCardProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleBuyNow = () => {
    const code = countryCode || (coverage[language]?.includes('Europë') || coverage[language]?.includes('Global') ? 'EU' : undefined);
    if (code && packageId) {
      navigate(`/checkout?country=${code}&package=${packageId}`);
    }
  };

  if (isPopular) {
    return (
      <div className="relative transform hover:scale-105 transition-all duration-300">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
        
        {/* Main card */}
        <div className="relative bg-white border-2 border-pink-200 rounded-2xl p-8 shadow-xl">
          {/* Most Popular Badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Most Popular
            </span>
          </div>

          {/* Flag and Title */}
          <div className="flex items-center gap-3 mt-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-200 rounded-full blur-sm"></div>
              <img src={countryCode === 'EU' ? EU_FLAG : flagUrl} alt="Flag" className="relative w-14 h-14 rounded-full border-2 border-pink-100" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-br from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h3>
          </div>

          {/* Price with special styling */}
          <div className="mb-8 text-center">
            <span className="text-5xl font-extrabold bg-gradient-to-br from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {price}
            </span>
          </div>

          {/* Features with gradient icons */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg">
              <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-2 rounded-lg">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-700 font-medium">{data[language]}</span>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg">
              <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-700 font-medium">{validity[language]}</span>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg">
              <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-2 rounded-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-700 font-medium">{coverage[language]}</span>
            </div>
          </div>

          {/* Buy Button with gradient and animation */}
          <button
            onClick={handleBuyNow}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-pink-200/50 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Buy now
          </button>
        </div>
      </div>
    );
  }

  // Regular card design for non-popular packages
  return (
    <div className="relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
      {/* Flag and Title */}
      <div className="flex items-center gap-2 mb-4">
        <img src={countryCode === 'EU' ? EU_FLAG : flagUrl} alt="Flag" className="w-12 h-12" />
        <h3 className="text-2xl font-bold text-black">{title}</h3>
      </div>

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
      </div>

      {/* Features */}
      <div className="flex items-center gap-8 text-gray-600 mb-6">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          <span>{data[language]}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span>{validity[language]}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          <span>{coverage[language]}</span>
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={handleBuyNow}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        Buy now
      </button>
    </div>
  );
};

export default PackageCard;