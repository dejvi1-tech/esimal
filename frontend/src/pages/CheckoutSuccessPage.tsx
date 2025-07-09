import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#4B0082] text-white">
      <div className="glass-medium p-8 md:p-12 rounded-2xl mx-auto max-w-3xl w-full text-white border border-white/20 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="w-16 h-16 text-accent" />
        </div>
        <h2 className="text-4xl font-bold mb-4 text-white">Faleminderit për blerjen!</h2>
        <p className="text-gray-200 mb-6">Pagesa u përfundua me sukses. Kontrolloni emailin për të marrë dhe aktivizuar eSIM-in tuaj.</p>
        {sessionId && (
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-200">Session ID: {sessionId}</p>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <a
            href="/"
            className="btn-glass bg-accent text-black w-full py-3 rounded-xl text-center"
          >
            Kthehu te kryefaqa
          </a>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage; 