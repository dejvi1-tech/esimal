import { useLanguage } from "@/contexts/LanguageContext";
import PackageCard from "./PackageCard";

const PackagesSection = () => {
  const { t } = useLanguage();

  const packages = [
    {
      title: "Europe 10GB",
      price: "€15",
      data: { en: "10GB", al: "10GB" },
      validity: { en: "30 days", al: "30 ditë" },
      coverage: { en: "Europe", al: "Europë" },
      isPopular: true,
      flagUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg",
      countryCode: "EU",
      packageId: "europe-10gb"
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4">
        {/* Removed packages_title, packages_subtitle, and the PackageCard grid as requested */}
      </div>
    </section>
  );
};

export default PackagesSection;