import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { User, Mail, Shield, Copy, Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { formatDate, copyToClipboard } from '../../utils';
import { userAPI } from '../../api';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user } = useAuth();
  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await userAPI.changePassword(passwordForm);
      toast.success('Password changed successfully! Check your email for confirmation.');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6 md:space-y-8" data-testid="profile-page">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="profile-title">Profile</h1>
        <p className="text-gray-400 text-sm md:text-base">Manage your account information</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="glass rounded-xl p-5 md:p-6" data-testid="user-info">
          <h2 className="text-lg md:text-xl font-bold text-white mb-5">User Information</h2>
          <div className="space-y-4 md:space-y-5">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <User className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">Full Name</div>
                <div className="text-base md:text-lg text-white font-bold">{user?.full_name}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">Email Address</div>
                <div className="text-base md:text-lg text-white break-all">{user?.email}</div>
              </div>
              {user?.is_email_verified && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">Account Level</div>
                <div className="text-base md:text-lg text-white font-bold">Level {user?.level}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">Member Since</div>
                <div className="text-base md:text-lg text-white">{formatDate(user?.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass rounded-xl p-5 md:p-6" data-testid="change-password">
          <h2 className="text-lg md:text-xl font-bold text-white mb-5">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white pr-12"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white pr-12"
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white pr-12"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Referral Information */}
      <div className="glass rounded-xl p-5 md:p-6" data-testid="referral-info">
        <h2 className="text-lg md:text-xl font-bold text-white mb-5">Referral Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Referral Code</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 bg-gray-900/50 rounded-lg px-4 py-3 text-white font-mono text-lg font-bold">
                {user?.referral_code}
              </div>
              <button
                onClick={() => handleCopy(user?.referral_code)}
                className="btn-secondary flex items-center justify-center gap-2"
                data-testid="copy-code-btn"
              >
                <Copy className="w-4 h-4" />
                Copy Code
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Referral Link</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 bg-gray-900/50 rounded-lg px-4 py-3 text-blue-400 text-sm break-all">
                {referralLink}
              </div>
              <button
                onClick={() => handleCopy(referralLink)}
                className="btn-secondary flex items-center justify-center gap-2"
                data-testid="copy-link-btn"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Share your referral link with friends to earn commissions when they invest. 
              Your commissions depend on your current package level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
