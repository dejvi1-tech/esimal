import { Helmet } from 'react-helmet-async';
import HowItWorksSection from "@/components/HowItWorksSection";
import HowToUseSection from "@/components/HowToUseSection";

const HowItWorksPage = () => {
  return (
    <>
      <Helmet>
        <title>How it Works | e-SimFly</title>
      </Helmet>
      <div className="pt-16">
        <HowToUseSection />
        <HowItWorksSection />
      </div>
    </>
  );
};

export default HowItWorksPage;