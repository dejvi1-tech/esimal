import { motion } from "motion/react";
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full md:w-1/2 text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-200">
                  {t('about_hero_title')}
                </h1>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                  {t('about_platform_description')}<br /><br />
                  {t('about_platform_services')}<br /><br />
                  {t('about_platform_vision')}
                </p>
              </motion.div>
              {/* Right: 4 Photo Grid Placeholder */}
              <div className="w-full md:w-1/2 flex flex-col gap-4 items-center md:items-end">
                <div className="flex gap-4 w-full md:w-auto">
                  <img src="/esimphoto.jpg" alt="E-SIM Fly team working" className="rounded-xl object-cover w-40 h-52 md:w-48 md:h-60 shadow-lg border border-white/10" />
                  <img src="/esimphoto1.jpg" alt="E-SIM Fly customer support" className="rounded-xl object-cover w-32 h-40 md:w-36 md:h-48 mt-10 shadow-md border border-white/10" />
                </div>
                <div className="flex gap-4 w-full md:w-auto mt-2 md:mt-0">
                  <img src="/esimphoto3.jpg" alt="E-SIM Fly technology" className="rounded-xl object-cover w-72 h-48 md:w-96 md:h-56 shadow-md object-center border border-white/10" />
                  <img src="/esimphoto4.jpg" alt="E-SIM Fly happy users" className="rounded-xl object-cover w-40 h-52 md:w-48 md:h-60 -mt-8 shadow-lg border border-white/10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Innovation Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-200">{t('about_innovation_title')}</h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                {t('about_innovation_desc')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{t('about_tech_title')}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t('about_tech_desc')}
                </p>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">{t('about_tech_launched')}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{t('about_global_impact_title')}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t('about_global_impact_desc')}
                </p>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">{t('about_global_impact_coverage')}</span>
                </div>
              </motion.div>
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
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-center mb-4">
                    <stat.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stat.number}</div>
                  <div className="text-gray-700 dark:text-gray-300">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center">
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
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutUsPage;