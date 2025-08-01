import { Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Deep purple glassmorphism card style
const glassClass =
  "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 bg-opacity-80 border border-purple-700 rounded-2xl p-8 shadow-xl backdrop-blur text-white";

const HowItWorks = () => {
  const { t } = useLanguage();

  // Dynamic steps based on translation
  const iphoneSteps = [
    t('iphone_step_1'),
    t('iphone_step_2'),
    t('iphone_step_3'),
    t('iphone_step_4')
  ];

  const androidSteps = [
    t('android_step_1'),
    t('android_step_2'),
    t('android_step_3'),
    t('android_step_4')
  ];

  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-3 text-purple-800">
          {t('how_it_works_title')}
        </h2>
        <p className="text-lg md:text-xl text-purple-900">
          {t('how_it_works_subtitle')}
        </p>
      </div>

      <div className="mb-10 flex justify-center">
        <img
          src="/esim-udhezues.png"
          alt="eSIM udhëzues"
          className="w-full max-w-2xl rounded-2xl shadow-lg border-2 border-purple-200"
          loading="lazy"
          width={600}
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* iPhone Card */}
        <div className={glassClass + " flex flex-col"}>
          <div className="flex items-center mb-5">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-400/70 text-white mr-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white">{t('how_it_works_iphone_title')}</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-white font-medium">
            {iphoneSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Android Card */}
        <div className={glassClass + " flex flex-col"}>
          <div className="flex items-center mb-5">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-400/70 text-white mr-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white">{t('how_it_works_android_title')}</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-white font-medium">
            {androidSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tip Box - deep purple glassmorphism */}
      <div className="mt-12 flex justify-center">
        <div className={glassClass + " text-center max-w-xl"}>
          <div className="text-2xl mb-2 text-white">{t('how_it_works_tip_title')}</div>
          <div className="text-white font-medium">
            {t('how_it_works_tip_description')}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 