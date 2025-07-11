import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import HowItWorks from '@/components/HowItWorks';

const HowItWorksPage = () => {
  const { t } = useLanguage();
  return (
    <>
      <Helmet>
        <title>{t('how_it_works_title')} | e-SimFly - Global eSIM Solutions</title>
        <meta name="description" content="Learn how to connect to eSIM on iPhone and Android devices. Simple step-by-step guide for eSIM activation." />
      </Helmet>
      <div className="pt-16">
        <HowItWorks />
      </div>
    </>
  );
};

export default HowItWorksPage;