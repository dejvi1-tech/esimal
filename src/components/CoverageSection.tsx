import { motion } from "motion/react";
import { Globe, MapPin, Wifi, Signal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/contexts/LanguageContext';

const CoverageSection = () => {
  const { t } = useLanguage();
  const regions = [
  {
    name: "Europe & UK",
    countries: 48,
    icon: "🇪🇺",
    description: "Comprehensive coverage across all EU countries plus UK, Norway, and Switzerland",
    speed: "Up to 5G",
    popular: ["France", "Germany", "Spain", "Italy", "UK"],
    color: "blue"
  },
  {
    name: "Asia Pacific",
    countries: 35,
    icon: "🌏",
    description: "High-speed connectivity from Japan to Australia, including Southeast Asia",
    speed: "Up to 5G",
    popular: ["Japan", "Singapore", "Australia", "South Korea", "Thailand"],
    color: "green"
  },
  {
    name: "Americas",
    countries: 42,
    icon: "🌎",
    description: "Coast-to-coast coverage in North and South America",
    speed: "Up to 5G",
    popular: ["USA", "Canada", "Mexico", "Brazil", "Argentina"],
    color: "purple"
  },
  {
    name: "Middle East & Africa",
    countries: 28,
    icon: "🌍",
    description: "Growing network across major business and tourism destinations",
    speed: "Up to 4G+",
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
    <section id="coverage" className="py-20 bg-white" data-id="n2ebdoarz" data-path="src/components/CoverageSection.tsx">
      <div className="container mx-auto px-4" data-id="1tduprz77" data-path="src/components/CoverageSection.tsx">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16" data-id="3ndvzldq4" data-path="src/components/CoverageSection.tsx">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-green-900 bg-clip-text text-transparent" data-id="u3w6wt2ef" data-path="src/components/CoverageSection.tsx">
            Global Network Coverage
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-id="ij031aclx" data-path="src/components/CoverageSection.tsx">
            Stay connected across 200+ countries and territories with our premium network partnerships and local carrier agreements.
          </p>
        </motion.div>

        {/* World Map Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16" data-id="2uvv8owmx" data-path="src/components/CoverageSection.tsx">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-8 text-white text-center relative overflow-hidden" data-id="ws6sm43fb" data-path="src/components/CoverageSection.tsx">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2MTBoMTB2LTEwem0wLTJ2MTBoMTBWMzJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" data-id="975zmehhb" data-path="src/components/CoverageSection.tsx"></div>
            
            <div className="relative z-10" data-id="wo1d3j6vj" data-path="src/components/CoverageSection.tsx">
              <h3 className="text-3xl md:text-4xl font-bold mb-4" data-id="5vhqugb5m" data-path="src/components/CoverageSection.tsx">
                {t('coverage_title')}
              </h3>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto" data-id="10scq8it4" data-path="src/components/CoverageSection.tsx">
                {t('coverage_description')}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto" data-id="96yegd59s" data-path="src/components/CoverageSection.tsx">
                <div className="text-center" data-id="uctebc60t" data-path="src/components/CoverageSection.tsx">
                  <div className="text-2xl md:text-3xl font-bold">200+</div>
                  <div className="text-blue-100 text-sm">{t('coverage_countries')}</div>
                </div>
                <div className="text-center" data-id="sb9gzzioz" data-path="src/components/CoverageSection.tsx">
                  <div className="text-2xl md:text-3xl font-bold">500+</div>
                  <div className="text-blue-100 text-sm">{t('coverage_networks')}</div>
                </div>
                <div className="text-center" data-id="5w7klpsmy" data-path="src/components/CoverageSection.tsx">
                  <div className="text-2xl md:text-3xl font-bold">99.9%</div>
                  <div className="text-blue-100 text-sm">{t('coverage_uptime')}</div>
                </div>
                <div className="text-center" data-id="bv003khka" data-path="src/components/CoverageSection.tsx">
                  <div className="text-2xl md:text-3xl font-bold">24/7</div>
                  <div className="text-blue-100 text-sm">{t('coverage_monitoring')}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Regional Coverage */}
        <div className="grid md:grid-cols-2 gap-8 mb-16" data-id="9blcf6ufo" data-path="src/components/CoverageSection.tsx">
          {regions.map((region, index) =>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            viewport={{ once: true }} data-id="n6k9m3ulr" data-path="src/components/CoverageSection.tsx">
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1" data-id="rvlotifom" data-path="src/components/CoverageSection.tsx">
                <CardContent className="p-6" data-id="sleugc8w1" data-path="src/components/CoverageSection.tsx">
                  <div className="flex items-center mb-4" data-id="0lic1q9k9" data-path="src/components/CoverageSection.tsx">
                    <div className="text-3xl mr-3" data-id="n3y7da3t3" data-path="src/components/CoverageSection.tsx">{region.icon}</div>
                    <div data-id="jl1j0ijch" data-path="src/components/CoverageSection.tsx">
                      <h3 className="text-xl font-bold text-gray-900" data-id="vnayiiypl" data-path="src/components/CoverageSection.tsx">{region.name}</h3>
                      <div className="text-sm text-gray-500" data-id="er9v6hxr4" data-path="src/components/CoverageSection.tsx">{region.countries} countries covered</div>
                    </div>
                    <Badge className={`ml-auto ${getColorClasses(region.color)} border`} data-id="3nyhlonvm" data-path="src/components/CoverageSection.tsx">
                      {region.speed}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4" data-id="y9w649fcx" data-path="src/components/CoverageSection.tsx">{region.description}</p>
                  
                  <div className="space-y-2" data-id="2zau1ip1i" data-path="src/components/CoverageSection.tsx">
                    <div className="text-sm font-semibold text-gray-700" data-id="rekzcel0v" data-path="src/components/CoverageSection.tsx">Popular destinations:</div>
                    <div className="flex flex-wrap gap-2" data-id="dk7vzjfok" data-path="src/components/CoverageSection.tsx">
                      {region.popular.map((country, i) =>
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full" data-id="ge5jetry1" data-path="src/components/CoverageSection.tsx">
                          {country}
                        </span>
                    )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Network Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16" data-id="pkvk73u9v" data-path="src/components/CoverageSection.tsx">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900" data-id="ey7vh6l3g" data-path="src/components/CoverageSection.tsx">
            Network Technology & Features
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-id="702h3wo04" data-path="src/components/CoverageSection.tsx">
            {networkFeatures.map((feature, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300" data-id="y24c6ra6m" data-path="src/components/CoverageSection.tsx">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${getColorClasses(feature.color)}`} data-id="z7fkhj8n6" data-path="src/components/CoverageSection.tsx">
                  <feature.icon className="w-6 h-6" data-id="8m8a437hh" data-path="src/components/CoverageSection.tsx" />
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-900" data-id="hl4kekpsr" data-path="src/components/CoverageSection.tsx">{feature.title}</h4>
                <p className="text-gray-600 text-sm" data-id="y1cwa356n" data-path="src/components/CoverageSection.tsx">{feature.description}</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Coverage Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center" data-id="h7jz0g9lx" data-path="src/components/CoverageSection.tsx">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 max-w-4xl mx-auto" data-id="8ob5urj2x" data-path="src/components/CoverageSection.tsx">
            <h3 className="text-2xl font-bold mb-4 text-gray-900" data-id="79ccpbsqe" data-path="src/components/CoverageSection.tsx">
              Coverage Guarantee
            </h3>
            <p className="text-gray-600 mb-6 text-lg" data-id="98wzp1tdt" data-path="src/components/CoverageSection.tsx">
              If you experience coverage issues in a listed country, we'll provide a full refund within 7 days. Your connectivity is our commitment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" data-id="1ejcrohfp" data-path="src/components/CoverageSection.tsx">
              <button className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 transition-colors" data-id="5rhys6lop" data-path="src/components/CoverageSection.tsx">
                View Coverage Map
              </button>
              <button className="border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-full hover:border-blue-600 hover:text-blue-600 transition-colors" data-id="qpdozzh2i" data-path="src/components/CoverageSection.tsx">
                Check My Destination
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>);

};

export default CoverageSection;