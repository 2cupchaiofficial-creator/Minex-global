import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/AuthContext';
import { authAPI } from '@/api';
import { toast } from 'sonner';
import { UserPlus, Mail, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  
  const [step, setStep] = useState(1); // 1: Form, 2: Verify Email, 3: Complete
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    referral_code: refCode || ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const validateForm = () => {
    if (!formData.email || !formData.full_name || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (!formData.referral_code) {
      toast.error('Referral code is required. You need a referral link to register.');
      return false;
    }
    return true;
  };

  const handleSendVerification = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await authAPI.sendVerification(formData.email);
      setCodeSent(true);
      setStep(2);
      toast.success('Verification code sent to your email!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyEmail(formData.email, verificationCode);
      setEmailVerified(true);
      toast.success('Email verified successfully!');
      // Proceed to registration
      await handleRegister();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      toast.success('Registration successful! Welcome to MINEX GLOBAL!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await authAPI.sendVerification(formData.email);
      toast.success('New verification code sent!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-[#02040A]"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 w-full max-w-md relative z-10"
        data-testid="register-form-container"
      >
        <div className="text-center mb-8">
          <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="register-title">
            {step === 1 && 'Join MINEX GLOBAL'}
            {step === 2 && 'Verify Your Email'}
          </h1>
          <p className="text-gray-400">
            {step === 1 && 'Create your account and start earning'}
            {step === 2 && `Enter the code sent to ${formData.email}`}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500' : 'bg-gray-700'} transition-colors`}>
            <span className="text-white text-sm font-bold">1</span>
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'} transition-colors`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'} transition-colors`}>
            <span className="text-white text-sm font-bold">2</span>
          </div>
        </div>

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleSendVerification(); }} className="space-y-4">
            <div data-testid="fullname-input-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white placeholder:text-gray-600"
                placeholder="Enter your full name"
                required
                data-testid="fullname-input"
              />
            </div>

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
                placeholder="Enter your password (min 6 characters)"
                required
                data-testid="password-input"
              />
            </div>

            <div data-testid="confirm-password-input-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white placeholder:text-gray-600"
                placeholder="Confirm your password"
                required
                data-testid="confirm-password-input"
              />
            </div>

            <div data-testid="referral-input-group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Referral Code <span className="text-red-400">*Required</span>
              </label>
              <input
                type="text"
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 uppercase"
                placeholder="Enter referral code"
                required
                data-testid="referral-input"
              />
              <p className="text-xs text-gray-500 mt-1">You need a valid referral link to register</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
              data-testid="register-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Verify Email & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Email Verification */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
              <Mail className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-300 text-sm">
                We've sent a 6-digit verification code to <span className="text-blue-400 font-bold">{formData.email}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-4 text-white text-center text-2xl tracking-widest font-mono placeholder:text-gray-600"
                placeholder="000000"
                maxLength={6}
                data-testid="verification-code-input"
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="w-full btn-primary flex items-center justify-center gap-2"
              data-testid="verify-code-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify & Create Account
                </>
              )}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Resend Code
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300" data-testid="login-link">
              Login here
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

export default RegisterPage;
