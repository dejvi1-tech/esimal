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
    {
      title: "Global 5GB",
      price: "€25",
      data: { en: "5GB", al: "5GB" },
      validity: { en: "30 days", al: "30 ditë" },
      coverage: { en: "Worldwide", al: "Botërore" },
      isPopular: false,
      flagUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Flag_of_the_United_Nations.svg",
      countryCode: "GL",
      packageId: "global-5gb"
    },
    {
      title: "USA 15GB",
      price: "€20",
      data: { en: "15GB", al: "15GB" },
      validity: { en: "30 days", al: "30 ditë" },
      coverage: { en: "United States", al: "Shtetet e Bashkuara" },
      isPopular: false,
      flagUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg",
      countryCode: "US",
      packageId: "usa-15gb"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
            {t('packages_title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('packages_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <PackageCard
              key={index}
              {...pkg}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;