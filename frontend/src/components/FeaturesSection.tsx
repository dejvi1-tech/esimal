import { Shield, Zap, Globe, CreditCard, Headphones, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Globe,
      title: t('feature_global_coverage_title'),
      description: t('feature_global_coverage_desc'),
      color: "blue"
    },
    {
      icon: Zap,
      title: t('feature_instant_activation_title'),
      description: t('feature_instant_activation_desc'),
      color: "yellow"
    },
    {
      icon: CreditCard,
      title: t('feature_no_hidden_fees_title'),
      description: t('feature_no_hidden_fees_desc'),
      color: "green"
    },
    {
      icon: Shield,
      title: t('feature_secure_reliable_title'),
      description: t('feature_secure_reliable_desc'),
      color: "purple"
    },
    {
      icon: Smartphone,
      title: t('feature_multiple_profiles_title'),
      description: t('feature_multiple_profiles_desc'),
      color: "indigo"
    },
    {
      icon: Headphones,
      title: t('feature_support_title'),
      description: t('feature_support_desc'),
      color: "pink"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      yellow: "bg-yellow-100 text-yellow-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      indigo: "bg-indigo-100 text-indigo-600",
      pink: "bg-pink-100 text-pink-600"
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
            {t('features_title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('features_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${getColorClasses(feature.color)}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;