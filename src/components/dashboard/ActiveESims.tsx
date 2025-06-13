import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';

type ESIMStatus = 'active' | 'expired' | 'pending';

interface ESIM {
  id: string;
  name: string;
  country: string;
  dataAmount: number;
  activationDate: string;
  expiryDate: string;
  status: ESIMStatus;
  qrCode?: string;
}

// Type guard to validate ESIM status
const isValidESIMStatus = (status: unknown): status is ESIMStatus => {
  return typeof status === 'string' && ['active', 'expired', 'pending'].includes(status as string);
};

// Type guard to validate ESIM object
const isValidESIM = (data: unknown): data is ESIM => {
  if (typeof data !== 'object' || data === null) return false;
  const esim = data as any;
  return (
    typeof esim.id === 'string' &&
    typeof esim.name === 'string' &&
    typeof esim.country === 'string' &&
    typeof esim.dataAmount === 'number' &&
    typeof esim.activationDate === 'string' &&
    typeof esim.expiryDate === 'string' &&
    isValidESIMStatus(esim.status) &&
    (esim.qrCode === undefined || typeof esim.qrCode === 'string')
  );
};

export const ActiveESims: React.FC = () => {
  const [esims, setEsims] = useState<ESIM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEsim, setSelectedEsim] = useState<ESIM | null>(null);

  useEffect(() => {
    const fetchESims = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/esims/active`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch eSIMs');
        }

        const rawData = await response.json();
        if (!Array.isArray(rawData)) {
          throw new Error('Invalid response format');
        }

        const validEsims = rawData
          .map(item => {
            if (!isValidESIM(item)) {
              return null;
            }
            return item;
          })
          .filter((item): item is ESIM => item !== null);

        setEsims(validEsims);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load eSIMs');
      } finally {
        setLoading(false);
      }
    };

    fetchESims();
  }, []);

  const getStatusColor = (status: ESIM['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRemainingDays = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    return days > 0 ? days : 0;
  };

  const handleActivate = async (esimId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/esims/${esimId}/activate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to activate eSIM');
      }

      // Refresh eSIMs list
      const updatedEsims = esims.map((esim) =>
        esim.id === esimId ? { ...esim, status: 'active' } : esim
      );
      setEsims(updatedEsims);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate eSIM');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (esims.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>No active eSIMs found. Purchase an eSIM to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedEsim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedEsim.name}
              </h3>
              <button
                onClick={() => setSelectedEsim(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {selectedEsim.qrCode ? (
              <div className="text-center">
                <img
                  src={selectedEsim.qrCode}
                  alt="eSIM QR Code"
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-gray-500">
                  Scan this QR code with your device to install the eSIM
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                QR code will be available after activation
              </p>
            )}
          </div>
        </div>
      )}

      {esims.map((esim) => (
        <div
          key={esim.id}
          className="bg-white shadow rounded-lg overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {esim.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{esim.country}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  esim.status
                )}`}
              >
                {esim.status.charAt(0).toUpperCase() + esim.status.slice(1)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Data Amount</p>
                <p className="mt-1 text-sm text-gray-900">{esim.dataAmount}GB</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Remaining Days</p>
                <p className="mt-1 text-sm text-gray-900">
                  {getRemainingDays(esim.expiryDate)} days
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Activation Date</p>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(esim.activationDate), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(esim.expiryDate), 'PPP')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              {esim.status === 'pending' && (
                <button
                  onClick={() => handleActivate(esim.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Activate eSIM
                </button>
              )}
              {esim.status === 'active' && (
                <button
                  onClick={() => setSelectedEsim(esim)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  View QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 