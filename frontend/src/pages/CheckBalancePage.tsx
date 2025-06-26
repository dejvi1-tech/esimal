import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

const CheckBalancePage: React.FC = () => {
  const { t } = useLanguage();
  const [esimNumber, setEsimNumber] = useState('');

  const handleCheckBalance = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically make an API call to check the balance
    alert(`Checking balance for eSIM: ${esimNumber}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{t('check_balance')} - e-SimFly</title>
      </Helmet>
      <div className="max-w-xl w-full space-y-8 text-center bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200">
            {t('your_esim_data')}
          </h1>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleCheckBalance}>
          <div className="rounded-md -space-y-px">
            <div className="text-left">
              <label htmlFor="esim-number" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('your_esim_number')}
              </label>
              <div className="flex rounded-md shadow-sm">
                <input
                  id="esim-number"
                  name="esim"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-4 bg-white/50 dark:bg-slate-800/50 border border-white/30 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-l-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder={t('enter_your_esim_number')}
                  value={esimNumber}
                  onChange={(e) => setEsimNumber(e.target.value)}
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-8 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {t('check_balance')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckBalancePage; 