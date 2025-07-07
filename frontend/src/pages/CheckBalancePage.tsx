import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

const CheckBalancePage: React.FC = () => {
  const { t } = useLanguage();
  const [esimNumber, setEsimNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any | null>(null);

  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esimNumber.trim()) return;

    setLoading(true);
    setError(null);
    setUsage(null);

    try {
      const response = await fetch(`/api/esims/usage/${esimNumber.trim()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch usage details');
      }

      setUsage(result.data);
    } catch (err: any) {
      setError(err.message || 'Failed to check balance');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!usage || !usage.dataLimit || usage.dataLimit === 0) return 0;
    return Math.min((usage.dataUsed / usage.dataLimit) * 100, 100);
  };

  // Get progress bar color based on usage
  const getProgressBarColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 30) return 'from-green-400 to-green-600';
    if (percentage < 70) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-red-600';
  };

  // Check if eSIM is expired (no data remaining)
  const isExpired = usage && usage.dataRemaining <= 0;

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
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-8 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  disabled={loading}
                >
                  {loading ? t('loading') : t('check_balance')}
                </button>
              </div>
            </div>
          </div>
        </form>
        {error && (
          <div className="mt-6 text-red-600 dark:text-red-400 font-semibold">{error}</div>
        )}
        {usage && (
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900 border border-purple-700 shadow-2xl text-left text-white">
            {/* eSIM Number */}
            <div className="mb-4 text-lg font-bold text-purple-200">
              eSIM: <span className="font-mono">{usage.iccid}</span>
            </div>
            
            {/* Status */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-200">Status:</span>
              {isExpired ? (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-900">
                  Expired ❌
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-900">
                  Active ✅
                </span>
              )}
            </div>
            
            {/* Usage Information */}
            <div className="mb-4 space-y-2">
              <div className="text-sm text-gray-200">
                Usage: <span className="font-semibold text-white">{usage.dataUsed || 0} GB</span> / <span className="font-semibold text-white">{usage.dataLimit || '?'} GB</span>
              </div>
              <div className="text-sm text-gray-200">
                Remaining: <span className="font-semibold text-white">{usage.dataRemaining || 0} GB</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${getProgressBarColor()} h-4 rounded-full transition-all duration-1000 ease-out`}
                  style={{ 
                    width: `${getProgressPercentage()}%`,
                    animation: 'slideIn 1s ease-out'
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            width: 0%;
          }
          to {
            width: ${usage ? getProgressPercentage() : 0}%;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckBalancePage; 