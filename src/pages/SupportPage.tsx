import FAQSection from "@/components/FAQSection";
import { Helmet } from 'react-helmet-async';

const SupportPage = () => {
  return (
    <>
      <Helmet>
        <title>Support | e-SimFly</title>
      </Helmet>
      <div className="pt-16">
        <FAQSection />
      </div>
    </>
  );
};

export default SupportPage;