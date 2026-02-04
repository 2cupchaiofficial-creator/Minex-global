import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Key, Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authAPI } from '@/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const [step, setStep] = useState(1); // 1: email, 2: verify code, 3: new password, 4: success
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });
      setSuccess('A reset code has been sent to your email');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.verifyResetCode({ email, code });
      setSuccess('Code verified! Enter your new password');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        email,
        code,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              MINEX GLOBAL
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">
            {step === 1 && 'Forgot Password?'}
            {step === 2 && 'Enter Reset Code'}
            {step === 3 && 'Create New Password'}
            {step === 4 && 'Password Reset!'}
          </h1>
          <p className="text-gray-400 mt-2">
            {step === 1 && "No worries, we'll send you reset instructions"}
            {step === 2 && 'Enter the 6-digit code sent to your email'}
            {step === 3 && 'Your new password must be at least 6 characters'}
            {step === 4 && 'You can now login with your new password'}
          </p>
        </div>

        {/* Progress Steps */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${
                  s === step
                    ? 'bg-blue-500 w-8'
                    : s < step
                    ? 'bg-green-500'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Form Container */}
        <div className="glass rounded-2xl p-8 border border-white/10" data-testid="forgot-password-form">
          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}

          {success && step !== 4 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-sm">{success}</span>
            </motion.div>
          )}

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-600 transition"
                    placeholder="Enter your email"
                    required
                    data-testid="forgot-email-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 font-bold flex items-center justify-center gap-2"
                data-testid="send-code-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Reset Code
                    <Mail className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Enter Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reset Code
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-600 transition text-center font-mono text-xl tracking-widest"
                    placeholder="XXXXXX"
                    maxLength={6}
                    required
                    data-testid="reset-code-input"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-2">Check your email for the 6-digit code</p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full btn-primary py-4 font-bold flex items-center justify-center gap-2"
                data-testid="verify-code-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify Code
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setCode(''); setError(''); setSuccess(''); }}
                className="w-full py-3 text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Change email
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-600 transition"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    data-testid="new-password-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-600 transition"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    data-testid="confirm-password-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 font-bold flex items-center justify-center gap-2"
                data-testid="reset-password-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <Lock className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Password Reset Successful!</h3>
                <p className="text-gray-400">You can now login with your new password.</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full btn-primary py-4 font-bold"
                data-testid="go-to-login-btn"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* Back to Login */}
          {step < 4 && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-gray-400 hover:text-white transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
