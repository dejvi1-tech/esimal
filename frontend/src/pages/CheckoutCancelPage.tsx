import React from 'react';
import { useNavigate } from 'react-router-dom';

const CheckoutCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#4B0082] text-white">
      <div className="glass-medium p-8 md:p-12 rounded-2xl mx-auto max-w-md w-full text-white border border-white/20 shadow-2xl backdrop-blur-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pagesa u anulua</h2>
          <p className="text-gray-200">Pagesa nuk u realizua. Ju lutemi provoni sërish ose kontrolloni të dhënat e kartës.</p>
        </div>
        
        <div className="flex flex-col gap-4 mt-4">
          <button
            onClick={() => navigate('/checkout')}
            className="btn-glass bg-accent text-black w-full py-3 rounded-xl text-center"
          >
            Provo Përsëri
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-glass bg-white/20 text-white w-full py-3 rounded-xl text-center"
          >
            Kthehu në Kryefaqe
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancelPage; 