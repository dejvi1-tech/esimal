import { Globe, Zap, Shield, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from 'react-helmet-async';

const AboutUsPage = () => {
  const { t } = useLanguage();
  return (
    <>
      <Helmet>
        <title>About | e-SimFly</title>
      </Helmet>
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
              {/* Left: About Us Text */}
              <div className="w-full md:w-1/2 text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-200">
                  {t('about_hero_title')}
                </h1>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                  {t('about_platform_description')}<br /><br />
                  {t('about_platform_services')}<br /><br />
                  {t('about_platform_vision')}
                </p>
              </div>
              {/* Right: Perfected, Responsive Image Grid with Wide 4th Photo */}
              <div className="w-full md:w-1/2 flex justify-center items-center">
                <div className="w-full rounded-3xl p-4 md:p-10 bg-gradient-to-br from-blue-300 via-indigo-300 to-purple-300 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-3 gap-6 items-center">
                    {/* Main eSIM Fly image */}
                    <img
                      src="/esimphoto.jpg"
                      alt="eSIM Fly Logo"
                      className="col-span-1 md:col-span-1 row-span-1 md:row-span-2 w-full h-36 md:h-56 object-contain rounded-2xl border-4 border-white shadow-xl bg-primary"
                    />
                    {/* Second image */}
                    <img
                      src="/esimphoto1.jpg"
                      alt="eSIM Installation"
                      className="col-span-1 md:col-span-1 row-span-1 md:row-span-1 w-full h-28 md:h-40 object-contain rounded-2xl border-4 border-white shadow-lg bg-primary"
                    />
                    {/* Third image */}
                    <img
                      src="/esimphoto3.jpg"
                      alt="eSIM Activation"
                      className="col-span-1 md:col-span-1 row-span-1 md:row-span-1 w-full h-28 md:h-40 object-contain rounded-2xl border-4 border-white shadow-lg bg-primary"
                    />
                    {/* Wide 4th image */}
                    <img
                      src="/esimphoto4.jpg"
                      alt="eSIM Global Coverage"
                      className="col-span-1 md:col-span-2 row-span-1 w-full h-32 md:h-48 object-contain rounded-2xl border-4 border-white shadow-2xl bg-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Innovation Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-200">{t('about_innovation_title')}</h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                {t('about_innovation_desc')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{t('about_tech_title')}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t('about_tech_desc')}
                </p>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">{t('about_tech_launched')}</span>
                </div>
              </div>

              <div className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{t('about_global_impact_title')}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t('about_global_impact_desc')}
                </p>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">{t('about_global_impact_coverage')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { number: "5M+", label: t('about_stat_customers'), icon: Globe },
                { number: "0.1s", label: t('about_stat_activation'), icon: Zap },
                { number: "24/7", label: t('about_stat_support'), icon: Shield },
                { number: "99.9%", label: t('about_stat_uptime'), icon: Sparkles }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-center mb-4">
                    <stat.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stat.number}</div>
                  <div className="text-gray-700 dark:text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-200">{t('about_vision_title')}</h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                {t('about_vision_desc')}
              </p>
              <div className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 text-white rounded-2xl p-8">
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {t('about_vision_quote')}
                </p>
                <p className="mt-4 text-gray-700 dark:text-gray-300/80">— eSim-Fly Founder</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutUsPage;