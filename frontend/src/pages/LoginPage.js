import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';
import { LogIn, Mail, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 md:w-[500px] h-72 md:h-[500px] bg-[#D4AF37]/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-72 md:w-[400px] h-72 md:h-[400px] bg-[#D4AF37]/15 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-10 w-full max-w-md relative z-10"
        data-testid="login-form-container"
      >
        <div className="text-center mb-8">
          <Link to="/">
            <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-10 mx-auto mb-6" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[#E0E0E0] mb-2 font-display" data-testid="login-title">Welcome Back</h1>
          <p className="text-[#A0A0A0] text-sm">Login to access your dashboard</p>
        </div>

        {emailNotVerified && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 text-sm font-medium">Email Not Verified</p>
                <p className="text-[#A0A0A0] text-xs mt-1">Please verify your email before logging in. Check your inbox for the verification code.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div data-testid="email-input-group">
            <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-dark"
              placeholder="Enter your email"
              required
              data-testid="email-input"
            />
          </div>

          <div data-testid="password-input-group">
            <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-dark"
              placeholder="Enter your password"
              required
              data-testid="password-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
            data-testid="login-submit-btn"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>

          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-[#A0A0A0] hover:text-[#D4AF37] text-sm transition-colors duration-300" data-testid="forgot-password-link">
              Forgot Password?
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[#A0A0A0] text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#D4AF37] hover:text-[#D4AF37] font-semibold transition-colors duration-300" data-testid="register-link">
              Register here
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-[#A0A0A0] hover:text-[#E0E0E0] text-sm transition-colors duration-300" data-testid="back-home-link">
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
