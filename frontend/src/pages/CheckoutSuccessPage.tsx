import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagesa u krye me sukses!</h2>
          <p className="text-gray-600">Faleminderit për blerjen tuaj. Kontrolloni email-in tuaj për detajet e eSIM.</p>
        </div>
        
        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Session ID: {sessionId}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kthehu në Ballina
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Shiko Porositë
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage; 