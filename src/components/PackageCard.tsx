import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Clock, Globe, Gift } from "lucide-react";
import { motion } from "motion/react";
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
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleBuyNow = () => {
    // Use the provided countryCode for navigation, unless it's undefined (fallback to 'EU' for global plans in popular packages)
    const code = countryCode || (coverage.includes('Europë') || coverage.includes('Global') ? 'EU' : undefined);
    if (code && packageId) {
      navigate(`/checkout?country=${code}&package=${packageId}`);
    }
  };

  return (
    <div className="relative group p-[1px] bg-gradient-to-br from-purple-400 via-blue-300 to-pink-300 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center relative">
        {/* Corner Ribbon */}
        {isPopular && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-tr-2xl rounded-bl-2xl shadow z-10 rotate-12">
            {t('most_popular')}
          </div>
        )}
        {/* Flag and Country */}
        <div className="flex items-center gap-1 mb-2 mt-1">
          <img src={countryCode === 'EU' ? EU_FLAG : flagUrl} alt="Flag" className="w-6 h-6 rounded-full border border-purple-200 shadow-sm" />
          <span className="font-semibold text-sm text-purple-700">{countryCode === 'EU' ? 'Europë' : countryCode}</span>
        </div>
        {/* Price in a pill */}
        <div className="mb-1">
          <span className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold px-4 py-1 rounded-full shadow border-2 border-white">
            {price}
          </span>
        </div>
        {/* Data & Validity */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-extrabold text-gray-900">{data}</span>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3 text-blue-500" /> {validity}
          </span>
        </div>
        {/* Features as pills */}
        <div className="flex flex-wrap gap-1 mb-2 justify-center">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
            <Wifi className="w-3 h-3" /> 4G/5G
          </span>
          {bonusData && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
              <Gift className="w-3 h-3" /> {bonusData}
            </span>
          )}
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
            <Globe className="w-3 h-3" /> {coverage.split(',')[0]}
          </span>
        </div>
        {/* Description */}
        {description && (
          <p className="text-gray-600 text-xs mb-2 text-center line-clamp-2">{description}</p>
        )}
        {/* Buy Now Button */}
        <button
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 rounded-lg font-bold text-base shadow transition-all"
          onClick={handleBuyNow}
        >
          {t('buy_now')}
        </button>
      </div>
    </div>
  );
};

export default PackageCard;