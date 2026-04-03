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
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    referral_code: refCode || '',
    country: '',
    city: '',
    whatsapp: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const validateForm = () => {
    if (!formData.email || !formData.full_name || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return false;
    }
    if (!formData.country || !formData.city || !formData.whatsapp) {
      toast.error('Please fill in Country, City, and WhatsApp number');
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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 md:w-[500px] h-72 md:h-[500px] bg-[#D4AF37]/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-10 w-72 md:w-[400px] h-72 md:h-[400px] bg-[#D4AF37]/15 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-10 w-full max-w-md relative z-10"
        data-testid="register-form-container"
      >
        <div className="text-center mb-8">
          <Link to="/">
            <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-10 mx-auto mb-6" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[#E0E0E0] mb-2 font-display" data-testid="register-title">
            {step === 1 && 'Join MINEX GLOBAL'}
            {step === 2 && 'Verify Your Email'}
          </h1>
          <p className="text-[#A0A0A0] text-sm">
            {step === 1 && 'Create your account and start earning'}
            {step === 2 && `Enter the code sent to ${formData.email}`}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${step >= 1 ? 'bg-[#D4AF37] shadow-lg shadow-purple-500/30' : 'bg-slate-800 border border-white/10'}`}>
            <span className="text-[#E0E0E0] text-sm font-bold">1</span>
          </div>
          <div className={`w-16 h-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-[#D4AF37]' : 'bg-slate-800'}`}></div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${step >= 2 ? 'bg-[#D4AF37] shadow-lg shadow-purple-500/30' : 'bg-slate-800 border border-white/10'}`}>
            <span className="text-[#E0E0E0] text-sm font-bold">2</span>
          </div>
        </div>

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleSendVerification(); }} className="space-y-4">
            <div data-testid="fullname-input-group">
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input-dark"
                placeholder="Enter your full name"
                required
                data-testid="fullname-input"
              />
            </div>

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
                placeholder="Enter your password (min 6 characters)"
                required
                data-testid="password-input"
              />
            </div>

            <div data-testid="confirm-password-input-group">
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input-dark"
                placeholder="Confirm your password"
                required
                data-testid="confirm-password-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div data-testid="country-input-group">
                <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input-dark"
                  placeholder="Your country"
                  required
                  data-testid="country-input"
                />
              </div>
              <div data-testid="city-input-group">
                <label className="block text-sm font-medium text-[#E0E0E0] mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input-dark"
                  placeholder="Your city"
                  required
                  data-testid="city-input"
                />
              </div>
            </div>

            <div data-testid="whatsapp-input-group">
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">WhatsApp Number</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="input-dark"
                placeholder="+1 234 567 8900"
                required
                data-testid="whatsapp-input"
              />
              <p className="text-xs text-[#A0A0A0] mt-1.5">Include country code (e.g., +92, +1)</p>
            </div>

            <div data-testid="referral-input-group">
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Referral Code <span className="text-[#D4AF37] text-xs ml-1">*Required</span>
              </label>
              <input
                type="text"
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                className="input-dark uppercase tracking-wider"
                placeholder="Enter referral code"
                required
                data-testid="referral-input"
              />
              <p className="text-xs text-[#A0A0A0] mt-1.5">You need a valid referral link to register</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 mt-6"
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
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <p className="text-[#E0E0E0] text-sm">
                We've sent a 6-digit verification code to <br/>
                <span className="text-[#D4AF37] font-semibold">{formData.email}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-xl bg-[#020617] border border-white/20 text-[#E0E0E0] text-center text-2xl tracking-[0.5em] font-mono py-4 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all placeholder:text-slate-600"
                placeholder="000000"
                maxLength={6}
                data-testid="verification-code-input"
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
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

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-[#A0A0A0] hover:text-[#E0E0E0] flex items-center gap-1.5 text-sm transition-colors duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-[#D4AF37] hover:text-[#D4AF37] text-sm font-medium transition-colors duration-300"
              >
                Resend Code
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[#A0A0A0] text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#D4AF37] hover:text-[#D4AF37] font-semibold transition-colors duration-300" data-testid="login-link">
              Login here
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

export default RegisterPage;
