import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const requestBody = { username, password };
    const url = `${API_URL}/api/admin/login`;

    console.log('🔐 Frontend login attempt');
    console.log('➡️ Request:', {
      method: 'POST',
      url,
      body: requestBody,
      headers: { 'Content-Type': 'application/json' }
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📡 Response data:', data);

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Login successful!');
        navigate('/admin');
      } else {
        const errorMessage = data.error || 'Login failed';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('❌ Login failed:', errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4B0082] text-white flex items-center justify-center">
      <div className="glass-medium p-8 md:p-12 rounded-2xl mx-auto max-w-md w-full text-white">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Admin Login</h2>
        <p className="text-gray-200 text-center mb-6">Access the admin panel</p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white">Username</label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-glass w-full text-white placeholder-gray-300"
                placeholder="Enter username"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white">Password</label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glass w-full text-white placeholder-gray-300"
                placeholder="Enter password"
              />
            </div>
          </div>
          {error && (
            <div className="modal-glass p-4 rounded-2xl max-w-lg mx-auto text-red-400">
              {error}
            </div>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-glass bg-accent text-black w-full py-3 rounded-xl text-center"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage; 