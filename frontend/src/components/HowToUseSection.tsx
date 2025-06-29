import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, Wifi, Globe, CheckCircle, Zap, Shield, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowToUseSection = () => {
  const { t } = useLanguage();

  const steps = [
    {
      id: 1,
      title: t('how_to_use_step1_title'),
      description: t('how_to_use_step1_desc'),
      image: "https://www.svgrepo.com/show/354000/cloud-download.svg",
      icon: Download,
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: t('how_to_use_step2_title'),
      description: t('how_to_use_step2_desc'),
      image: "https://www.svgrepo.com/show/451215/qr-code.svg",
      icon: Smartphone,
      color: "bg-green-500"
    },
    {
      id: 3,
      title: t('how_to_use_step3_title'),
      description: t('how_to_use_step3_desc'),
      image: "https://www.svgrepo.com/show/131974/settings.svg",
      icon: Wifi,
      color: "bg-purple-500"
    },
    {
      id: 4,
      title: t('how_to_use_step4_title'),
      description: t('how_to_use_step4_desc'),
      image: "https://www.svgrepo.com/show/303150/internet.svg",
      icon: Globe,
      color: "bg-orange-500"
    }
  ];

  const compatibleDevices = [
    { name: "iPhone 14 Pro", icon: Smartphone },
    { name: "Samsung Galaxy S23", icon: Smartphone },
    { name: "Google Pixel 7", icon: Smartphone },
    { name: "iPad Pro", icon: Smartphone },
    { name: "MacBook Pro", icon: Smartphone },
    { name: "Windows Laptop", icon: Smartphone }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
            {t('how_to_use_title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('how_to_use_subtitle')}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {steps.map((step, index) =>
          <div
            key={step.id}
            className="relative">

              <Card className="h-full bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Step Image */}
                <div className="h-40 overflow-hidden">
                  <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover" />

                  <div className="absolute top-4 left-4">
                    <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center shadow-lg bg-opacity-30`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold text-gray-800">{step.id}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">{step.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Compatibility Section */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-6 text-gray-900">
            {t('how_to_use_compatible_title')}
          </h3>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('how_to_use_compatible_desc')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {compatibleDevices.map((device, index) =>
            <div
              key={index}
              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <device.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{device.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              {t('how_to_use_cta_title')}
            </h3>
            <p className="text-blue-100 mb-6">
              {t('how_to_use_cta_desc')}
            </p>
            <button className="bg-white text-blue-600 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors text-lg">
              {t('how_to_use_cta_button')}
            </button>
          </div>
        </div>
      </div>
    </section>);

};

export default HowToUseSection;