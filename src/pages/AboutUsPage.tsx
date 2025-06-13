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
        <section className="relative py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
              {/* Left: About Us Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full md:w-1/2 text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('about_hero_title')}
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  {t('about_platform_description')}<br /><br />
                  {t('about_platform_services')}<br /><br />
                  {t('about_platform_vision')}
                </p>
              </motion.div>
              {/* Right: 4 Photo Grid Placeholder */}
              <div className="w-full md:w-1/2 flex flex-col gap-4 items-center md:items-end">
                <div className="flex gap-4 w-full md:w-auto">
                  <img src="/esimphoto.jpg" alt="E-SIM Fly team working" className="rounded-xl object-cover w-40 h-52 md:w-48 md:h-60 shadow-lg" />
                  <img src="/esimphoto1.jpg" alt="E-SIM Fly customer support" className="rounded-xl object-cover w-32 h-40 md:w-36 md:h-48 mt-10 shadow-md" />
                </div>
                <div className="flex gap-4 w-full md:w-auto mt-2 md:mt-0">
                  <img src="/esimphoto3.jpg" alt="E-SIM Fly technology" className="rounded-xl object-cover w-72 h-48 md:w-96 md:h-56 shadow-md object-center" />
                  <img src="/esimphoto4.jpg" alt="E-SIM Fly happy users" className="rounded-xl object-cover w-40 h-52 md:w-48 md:h-60 -mt-8 shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Innovation Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('about_innovation_title')}</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('about_innovation_desc')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4">{t('about_tech_title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('about_tech_desc')}
                </p>
                <div className="flex items-center gap-2 text-blue-600">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">{t('about_tech_launched')}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4">{t('about_global_impact_title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('about_global_impact_desc')}
                </p>
                <div className="flex items-center gap-2 text-purple-600">
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">{t('about_global_impact_coverage')}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
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
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-center mb-4">
                    <stat.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('about_vision_title')}</h2>
              <p className="text-xl text-gray-600 mb-8">
                {t('about_vision_desc')}
              </p>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8">
                <p className="text-lg font-medium">
                  {t('about_vision_quote')}
                </p>
                <p className="mt-4 text-white/80">— eSim-Fly Founder</p>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutUsPage;