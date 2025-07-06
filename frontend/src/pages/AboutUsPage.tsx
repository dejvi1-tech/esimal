import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import LazyImage from '@/components/ui/LazyImage';

const AboutUsPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('about_us_title')} - E-eSimFly</title>
        <meta name="description" content={t('about_us_description')} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                {t('about_us_title')}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t('about_us_subtitle')}
              </p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('about_us_mission_title')}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('about_us_mission_text')}
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {t('about_us_vision_title')}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('about_us_vision_text')}
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {t('about_us_values_title')}
                  </h3>
                  <ul className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-3">•</span>
                      {t('about_us_values_innovation')}
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-3">•</span>
                      {t('about_us_values_quality')}
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-3">•</span>
                      {t('about_us_values_customer')}
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-3">•</span>
                      {t('about_us_values_global')}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right: Image Grid */}
              <div className="w-full md:w-1/2 flex justify-center items-center">
                <div className="w-full rounded-3xl p-4 md:p-10 bg-gradient-to-br from-blue-300 via-indigo-300 to-purple-300 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-3 gap-6 items-center">
                    {/* Main eSIM Fly image */}
                    <LazyImage
                      src="/esimphoto.webp"
                      alt="eSIM Fly Logo"
                      className="col-span-1 md:col-span-1 row-span-1 md:row-span-2 w-full h-36 md:h-56 object-contain rounded-2xl border-4 border-white shadow-xl bg-primary"
                      priority={true}
                    />
                    {/* Second image */}
                    <LazyImage
                      src="/esimphoto1.webp"
                      alt="eSIM Installation"
                      className="col-span-1 md:col-span-1 row-span-1 md:row-span-1 w-full h-28 md:h-40 object-contain rounded-2xl border-4 border-white shadow-lg bg-primary"
                    />
                    {/* Third image */}
                    <LazyImage
                      src="/esimphoto3.webp"
                      alt="eSIM Activation"
                      className="col-span-1 md:col-span-1 row-span-1 md:row-span-1 w-full h-28 md:h-40 object-contain rounded-2xl border-4 border-white shadow-lg bg-primary"
                    />
                    {/* Wide 4th image */}
                    <LazyImage
                      src="/esimphoto4.webp"
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
        <section className="py-16 px-4 bg-white dark:bg-gray-800">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {t('about_us_innovation_title')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t('about_us_innovation_subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('about_us_innovation_tech_title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('about_us_innovation_tech_text')}
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('about_us_innovation_security_title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('about_us_innovation_security_text')}
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('about_us_innovation_global_title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('about_us_innovation_global_text')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {t('about_us_team_title')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t('about_us_team_subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">JD</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('about_us_team_member_1_name')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('about_us_team_member_1_role')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">SM</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('about_us_team_member_2_name')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('about_us_team_member_2_role')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">AL</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('about_us_team_member_3_name')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('about_us_team_member_3_role')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">MK</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('about_us_team_member_4_name')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('about_us_team_member_4_role')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutUsPage;