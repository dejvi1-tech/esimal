import PackageCard from "./PackageCard";
import { motion } from "motion/react";
import { globalPackages } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";

const PackagesSection = () => {
  const { t } = useLanguage();
  const packages = globalPackages.map((pkg, index) => ({
    title: `${pkg.data} / ${pkg.validity} / ${pkg.coverage}`,
    price: pkg.price,
    data: pkg.data,
    validity: pkg.validity,
    coverage: pkg.coverage,
    description: pkg.description,
    bonusData: pkg.bonusData,
    isOffer: pkg.isOffer,
    isPopular: index === 3,
    specialFeatures: pkg.specialFeatures,
    delay: index * 0.1,
    flagUrl: pkg.id === 'uk-special' ? "https://flagcdn.com/w40/gb.png" : "https://flagcdn.com/w40/eu.png",
    countryCode: "EU",
    packageId: pkg.id
  }));

  return (
    <section id="packages" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg" alt="EU Flag" className="w-12 h-12" />
            <h2 className="text-4xl font-bold text-gray-900">
              Internet kudo në Europë dhe Rajon me esim 5G
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {/* Removed the description text as requested */}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {packages.map((pkg, index) => (
            <PackageCard key={pkg.packageId} {...pkg} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;