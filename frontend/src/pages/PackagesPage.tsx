import React from 'react';
import PackagesSection from '@/components/PackagesSection';
import BundlePackagesSection from '@/components/BundlePackagesSection';
import { Helmet } from 'react-helmet-async';

const PackagesPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>eSIM Packages - Global Coverage</title>
        <meta name="description" content="Browse our wide selection of eSIM packages for global connectivity. Find the perfect plan for your travel needs." />
      </Helmet>

      <div className="pt-24">
        <BundlePackagesSection />
        <PackagesSection />
      </div>
    </>
  );
};

export default PackagesPage; 