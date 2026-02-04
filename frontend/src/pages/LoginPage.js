import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';
import { LogIn, Mail, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotVerified(false);
    
    try {
      const result = await login(formData.email, formData.password);
      toast.success('Login successful!');
      
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      if (errorMessage.includes('verify your email')) {
        setEmailNotVerified(true);
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-[#02040A]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 w-full max-w-md relative z-10"
        data-testid="login-form-container"
      >
        <div className="text-center mb-8">
          <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="login-title">Welcome Back</h1>
          <p className="text-gray-400">Login to access your dashboard</p>
        </div>

        {emailNotVerified && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 text-sm font-medium">Email Not Verified</p>
                <p className="text-gray-400 text-xs mt-1">Please verify your email before logging in. Check your inbox for the verification code.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div data-testid="email-input-group">
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white placeholder:text-gray-600"
              placeholder="Enter your email"
              required
              data-testid="email-input"
            />
          </div>

          <div data-testid="password-input-group">
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white placeholder:text-gray-600"
              placeholder="Enter your password"
              required
              data-testid="password-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
            data-testid="login-submit-btn"
          >
            {loading ? 'Logging in...' : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>

          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-gray-400 hover:text-blue-400 text-sm transition" data-testid="forgot-password-link">
              Forgot Password?
            </Link>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300" data-testid="register-link">
              Register here
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-gray-500 hover:text-gray-400 text-sm" data-testid="back-home-link">
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
