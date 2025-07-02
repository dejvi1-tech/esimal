import { Signal, Wifi, Globe, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import EUFlag from '/images/eu.png';

const CoverageSection = () => {
  const { t } = useLanguage();

  const regions = [
  {
    name: "Europe",
    icon: "🌍",
    countries: 39,
    speed: "5G Ready",
    description: "Comprehensive coverage across all European countries with high-speed 5G and 4G LTE networks.",
    popular: ["France", "Germany", "Italy", "Spain", "Netherlands"],
    color: "blue"
  },
  {
    name: "North America",
    icon: "🌎",
    countries: 3,
    speed: "5G Ready",
    description: "Full coverage across the United States, Canada, and Mexico with premium network partnerships.",
    popular: ["USA", "Canada", "Mexico"],
    color: "green"
  },
  {
    name: "Asia Pacific",
    icon: "🌏",
    countries: 25,
    speed: "4G+",
    description: "Extensive coverage across major Asian countries with reliable 4G LTE and emerging 5G networks.",
    popular: ["Japan", "South Korea", "Singapore", "Thailand", "Australia"],
    color: "purple"
  },
  {
    name: "Africa & Middle East",
    icon: "🌍",
    countries: 15,
    speed: "4G",
    description: "Growing coverage across key African and Middle Eastern destinations with stable 4G networks.",
    popular: ["UAE", "South Africa", "Egypt", "Kenya", "Morocco"],
    color: "orange"
  }];


  const networkFeatures = [
  {
    icon: Signal,
    title: "5G Ready",
    description: "Access to the latest 5G networks where available",
    color: "blue"
  },
  {
    icon: Wifi,
    title: "4G Everywhere",
    description: "Reliable 4G LTE coverage in all supported countries",
    color: "green"
  },
  {
    icon: Globe,
    title: "Multi-Network",
    description: "Automatic connection to the best available network",
    color: "purple"
  },
  {
    icon: MapPin,
    title: "Real-time Coverage",
    description: "Live coverage maps updated daily",
    color: "orange"
  }];


  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      green: "bg-green-100 text-green-600 border-green-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
      orange: "bg-orange-100 text-orange-600 border-orange-200"
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section id="coverage" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-green-900 bg-clip-text text-transparent">
            Global Network Coverage
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay connected across 200+ countries and territories with our premium network partnerships and local carrier agreements.
          </p>
        </div>

        {/* World Map Visualization */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-8 text-white text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2MTBoMTB2LTEwem0wLTJ2MTBoMTBWMzJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                {t('coverage_title')}
              </h3>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                {t('coverage_description')}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold">200+</div>
                  <div className="text-blue-100 text-sm">{t('coverage_countries')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold">500+</div>
                  <div className="text-blue-100 text-sm">{t('coverage_networks')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold">99.9%</div>
                  <div className="text-blue-100 text-sm">{t('coverage_uptime')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold">24/7</div>
                  <div className="text-blue-100 text-sm">{t('coverage_monitoring')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Coverage */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {regions.map((region, index) =>
          <div key={index}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{region.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{region.name}</h3>
                      <div className="text-sm text-gray-500">{region.countries} countries covered</div>
                    </div>
                    <Badge className={`ml-auto ${getColorClasses(region.color)} border`}>
                      {region.speed}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{region.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700">Popular destinations:</div>
                    <div className="flex items-center flex-wrap gap-2">
                      {region.name === "Europe" && (
                        <img src={EUFlag} alt="EU Flag" className="w-8 h-8 rounded-full border-2 border-blue-200 bg-white" style={{objectFit: 'cover'}} />
                      )}
                      {region.popular.map((country, i) =>
                        <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {country}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Network Features */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900">
            Network Technology & Features
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {networkFeatures.map((feature, index) =>
            <div
              key={index}
              className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${getColorClasses(feature.color)}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Coverage Guarantee */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Coverage Guarantee
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              If you experience coverage issues in a listed country, we'll provide a full refund within 7 days. Your connectivity is our commitment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 transition-colors">
                View Coverage Map
              </button>
              <button className="border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-full hover:border-blue-600 hover:text-blue-600 transition-colors">
                Check My Destination
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default CoverageSection;