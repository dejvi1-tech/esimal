import CountryPackagesSection from "@/components/CountryPackagesSection";
import PackagesSection from "@/components/PackagesSection";
import { Helmet } from 'react-helmet-async';

const PackagesPage = () => {
  return (
    <>
      <Helmet>
        <title>Packages | e-SimFly</title>
      </Helmet>
      <div className="pt-16">
        <CountryPackagesSection />
        <PackagesSection />
      </div>
    </>
  );
};

export default PackagesPage;