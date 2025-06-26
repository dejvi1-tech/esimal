import PackageCard from "./PackageCard";
import { motion } from "motion/react";
import { globalPackages } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";

const PackagesSection = () => {
  const { t, language } = useLanguage();
  const packages = globalPackages.map((pkg, index) => ({
    title: pkg.name[language],
    price: pkg.price,
    data: pkg.name[language],
    validity: pkg.validity[language],
    coverage: pkg.coverage[language],
    description: pkg.description?.[language],
    bonusData: pkg.bonusData?.[language],
    isOffer: pkg.isOffer,
    isPopular: index === 3,
    specialFeatures: pkg.specialFeatures?.map(f => f[language]),
    delay: index * 0.1,
    flagUrl: pkg.id === 'uk-special' ? "https://flagcdn.com/w40/gb.png" : "https://flagcdn.com/w40/eu.png",
    countryCode: "EU",
    packageId: pkg.id
  }));

  return (
    <section id="packages" className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Title and flag removed */}
          </div>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            {/* Removed the description text as requested */}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Package cards were here */}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;