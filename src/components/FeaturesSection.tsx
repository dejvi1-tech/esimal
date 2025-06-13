import { motion } from "motion/react";
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

  return null;
};

export default FeaturesSection;