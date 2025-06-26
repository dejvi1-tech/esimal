import React from 'react';
import { useNavigate } from 'react-router-dom';

const CheckoutCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagesa u anulua</h2>
          <p className="text-gray-600">Pagesa juaj u anulua. Asnjë tarifë nuk u bë në llogarinë tuaj.</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Provo Përsëri
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Kthehu në Ballina
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancelPage; 