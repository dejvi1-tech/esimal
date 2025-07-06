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
      const response = await fetch(`https://esimal.onrender.com/api/esims/usage/${esimNumber.trim()}`);
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
          <div className="mt-8 p-6 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-purple-200 dark:border-purple-700 shadow-md text-left">
            <div className="mb-2 text-lg font-bold text-purple-700 dark:text-purple-300">eSIM: <span className="font-mono">{usage.iccid}</span></div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${usage.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{usage.status}</span>
            </div>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">Expiry: {usage.expiry ? new Date(usage.expiry).toLocaleDateString() : 'N/A'}</div>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Used: {usage.dataUsed ?? '?'} GB</span>
                <span>Limit: {usage.dataLimit ?? '?'} GB</span>
                <span>Remaining: {usage.dataRemaining ?? '?'} GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: usage.dataLimit && usage.dataUsed != null ? `${Math.min(100, (usage.dataUsed / usage.dataLimit) * 100)}%` : '0%' }}
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Checked: {usage.createdAt ? new Date(usage.createdAt).toLocaleString() : '-'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckBalancePage; 