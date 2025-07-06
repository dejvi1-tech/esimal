import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

const AboutUsPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('about_us_title')} - E-eSimFly</title>
        <meta name="description" content={t('about_us_description')} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center py-12">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto mb-12">
          <div className="glass-card p-10 rounded-3xl shadow-2xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              {t('about_us_title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('about_us_subtitle')}
            </p>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="w-full max-w-4xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl shadow-xl text-center flex flex-col items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('about_us_mission_title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('about_us_mission_text')}
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl shadow-xl text-center flex flex-col items-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('about_us_vision_title')}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('about_us_vision_text')}
            </p>
          </div>
          <div className="glass-card p-8 rounded-2xl shadow-xl text-center flex flex-col items-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('about_us_values_title')}
            </h3>
            <ul className="space-y-3 text-lg text-gray-600 dark:text-gray-300">
              <li className="flex items-center justify-center"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span>{t('about_us_values_innovation')}</li>
              <li className="flex items-center justify-center"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span>{t('about_us_values_quality')}</li>
              <li className="flex items-center justify-center"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span>{t('about_us_values_customer')}</li>
              <li className="flex items-center justify-center"><span className="text-blue-600 dark:text-blue-400 mr-2">•</span>{t('about_us_values_global')}</li>
            </ul>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full max-w-4xl mx-auto mb-12">
          <div className="glass-card p-10 rounded-3xl shadow-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {t('about_us_team_title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
              {t('about_us_team_subtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center flex flex-col items-center">
                <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">JD</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('about_us_team_member_1_name')}</h3>
                <p className="text-gray-600 dark:text-gray-300">{t('about_us_team_member_1_role')}</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-white bg-gradient-to-br from-green-500 to-blue-600 shadow-lg">SM</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('about_us_team_member_2_name')}</h3>
                <p className="text-gray-600 dark:text-gray-300">{t('about_us_team_member_2_role')}</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-white bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">AL</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('about_us_team_member_3_name')}</h3>
                <p className="text-gray-600 dark:text-gray-300">{t('about_us_team_member_3_role')}</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-white bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">MK</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('about_us_team_member_4_name')}</h3>
                <p className="text-gray-600 dark:text-gray-300">{t('about_us_team_member_4_role')}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Glassmorphism utility styles */}
      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(18px) saturate(180%);
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          border-radius: 2rem;
          border: 1.5px solid rgba(200,200,255,0.18);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.10);
        }
        .dark .glass-card {
          background: rgba(30,34,54,0.7);
          border: 1.5px solid rgba(80,80,180,0.18);
        }
      `}</style>
    </>
  );
};

export default AboutUsPage;