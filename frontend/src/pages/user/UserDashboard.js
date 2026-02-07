import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Users, Gift, ArrowUpRight, DollarSign, Zap, Target, Clock, Sparkles } from 'lucide-react';
import { userAPI, membershipAPI, promotionAPI } from '@/api';
import { formatCurrency } from '@/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [activePromotion, setActivePromotion] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!activePromotion) return;

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(activePromotion.end_date);
      const diff = end - now;

      if (diff <= 0) {
        setCountdown(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activePromotion]);

  const loadData = async () => {
    try {
      const [statsRes, packagesRes, promoRes] = await Promise.all([
        userAPI.getDashboard(),
        membershipAPI.getPackages(),
        promotionAPI.getActive().catch(() => ({ data: null }))
      ]);
      setStats(statsRes.data);
      setPackages(packagesRes.data);
      setActivePromotion(promoRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentPackage = packages.find(p => p.level === stats?.current_level);
  const nextPackage = packages.find(p => p.level === stats?.current_level + 1);

  return (
    <div className="space-y-6 md:space-y-8" data-testid="user-dashboard">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="dashboard-title">Dashboard</h1>
        <p className="text-gray-400 text-sm md:text-base">Welcome back! Here's your portfolio overview</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Cash Wallet Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass rounded-xl p-4 md:p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 cursor-pointer relative overflow-hidden group"
          data-testid="total-balance-card"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="p-2 md:p-3 bg-blue-500/20 rounded-lg"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-300" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ArrowUpRight className="w-4 h-4 text-green-400" />
            </motion.div>
          </div>
          <motion.div 
            className="text-xl md:text-2xl font-bold text-white mb-1 font-mono" 
            data-testid="total-balance-value"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {formatCurrency(stats?.total_balance || 0)}
          </motion.div>
          <div className="text-xs md:text-sm text-blue-200">Cash Wallet</div>
        </motion.div>

        {/* ROI Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="glass rounded-xl p-4 md:p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer relative overflow-hidden group"
          data-testid="roi-balance-card"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="p-2 md:p-3 bg-green-500/20 rounded-lg"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-300" />
            </motion.div>
            <motion.span 
              className="text-green-300 text-xs font-bold bg-green-500/20 px-2 py-0.5 rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              {stats?.daily_roi_percentage}%
            </motion.span>
          </div>
          <motion.div 
            className="text-xl md:text-2xl font-bold text-white mb-1 font-mono" 
            data-testid="roi-balance-value"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {formatCurrency(stats?.roi_balance || 0)}
          </motion.div>
          <div className="text-xs md:text-sm text-green-200">ROI Earned</div>
        </motion.div>

        {/* Commission Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(168, 85, 247, 0.3)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="glass rounded-xl p-4 md:p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 cursor-pointer relative overflow-hidden group"
          data-testid="commission-balance-card"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="p-2 md:p-3 bg-purple-500/20 rounded-lg"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Gift className="w-5 h-5 md:w-6 md:h-6 text-purple-300" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
            >
              <ArrowUpRight className="w-4 h-4 text-green-400" />
            </motion.div>
          </div>
          <motion.div 
            className="text-xl md:text-2xl font-bold text-white mb-1 font-mono" 
            data-testid="commission-balance-value"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {formatCurrency(stats?.commission_balance || 0)}
          </motion.div>
          <div className="text-xs md:text-sm text-purple-200">Commissions</div>
        </motion.div>

        {/* Team Size */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(249, 115, 22, 0.3)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
          className="glass rounded-xl p-4 md:p-5 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 cursor-pointer relative overflow-hidden group"
          data-testid="team-card"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="p-2 md:p-3 bg-orange-500/20 rounded-lg"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Users className="w-5 h-5 md:w-6 md:h-6 text-orange-300" />
            </motion.div>
          </div>
          <motion.div 
            className="text-xl md:text-2xl font-bold text-white mb-1" 
            data-testid="team-count-value"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {stats?.direct_referrals || 0} / {stats?.indirect_referrals || 0}
          </motion.div>
          <div className="text-xs md:text-sm text-orange-200">Direct / Indirect</div>
        </motion.div>
      </div>

      {/* Active Promotion Card - Prominently Displayed */}
      {activePromotion && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative overflow-hidden rounded-2xl"
          data-testid="active-promotion-card"
        >
          {/* Glowing Border Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 animate-pulse opacity-70 blur-sm"></div>
          <div className="absolute inset-[2px] rounded-2xl bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 opacity-30"></div>
          
          {/* Animated Glow Ring */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-spin-slow opacity-50" style={{animationDuration: '3s'}}></div>
          </div>
          
          {/* Card Content */}
          <div className="relative glass rounded-2xl p-5 md:p-6 bg-gradient-to-br from-green-900/80 via-emerald-900/70 to-green-900/80 border border-green-500/50">
            {/* ACTIVE Badge */}
            <div className="absolute top-3 right-3 md:top-4 md:right-4">
              <motion.div 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-black rounded-full shadow-lg shadow-green-500/50"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(34, 197, 94, 0.5)",
                    "0 0 40px rgba(34, 197, 94, 0.8)",
                    "0 0 20px rgba(34, 197, 94, 0.5)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <Sparkles className="w-3 h-3" />
                ACTIVE
              </motion.div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-5">
              {/* Icon & Title Section */}
              <div className="flex items-center gap-4">
                <motion.div 
                  className="p-4 bg-green-500/30 rounded-xl border border-green-400/30"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Gift className="w-8 h-8 text-green-300" />
                </motion.div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white mb-1">{activePromotion.name}</h3>
                  <p className="text-green-200/80 text-sm">Limited Time Promotion</p>
                </div>
              </div>

              {/* Rewards Section */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="bg-green-500/20 rounded-xl p-4 border border-green-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-300" />
                    <span className="text-green-200 text-xs uppercase font-bold">Self Deposit</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white">
                    {activePromotion.self_deposit_reward_percent}%
                  </div>
                  <p className="text-green-300/60 text-xs mt-1">Reward on your deposits</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-300" />
                    <span className="text-blue-200 text-xs uppercase font-bold">Referral</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white">
                    {activePromotion.direct_referral_reward_percent}%
                  </div>
                  <p className="text-blue-300/60 text-xs mt-1">From referral deposits</p>
                </div>
              </div>
            </div>

            {/* Countdown Timer */}
            {countdown && (
              <div className="mt-5 pt-5 border-t border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-200">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Ends in:</span>
                  </div>
                  <div className="flex gap-2 md:gap-3">
                    <div className="bg-black/30 rounded-lg px-3 py-2 text-center min-w-[50px]">
                      <div className="text-xl md:text-2xl font-black text-white">{countdown.days}</div>
                      <div className="text-[10px] text-green-300/60 uppercase">Days</div>
                    </div>
                    <div className="bg-black/30 rounded-lg px-3 py-2 text-center min-w-[50px]">
                      <div className="text-xl md:text-2xl font-black text-white">{String(countdown.hours).padStart(2, '0')}</div>
                      <div className="text-[10px] text-green-300/60 uppercase">Hours</div>
                    </div>
                    <div className="bg-black/30 rounded-lg px-3 py-2 text-center min-w-[50px]">
                      <div className="text-xl md:text-2xl font-black text-white">{String(countdown.minutes).padStart(2, '0')}</div>
                      <div className="text-[10px] text-green-300/60 uppercase">Min</div>
                    </div>
                    <div className="bg-black/30 rounded-lg px-3 py-2 text-center min-w-[50px]">
                      <motion.div 
                        className="text-xl md:text-2xl font-black text-white"
                        key={countdown.seconds}
                        initial={{ scale: 1.2, color: "#4ade80" }}
                        animate={{ scale: 1, color: "#ffffff" }}
                        transition={{ duration: 0.3 }}
                      >
                        {String(countdown.seconds).padStart(2, '0')}
                      </motion.div>
                      <div className="text-[10px] text-green-300/60 uppercase">Sec</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-4">
              <Link 
                to="/deposit"
                className="block w-full text-center py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
              >
                Deposit Now & Earn Rewards
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="glass rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span className="text-xs md:text-sm text-gray-400">Total Investment</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-white font-mono">{formatCurrency(stats?.total_investment || 0)}</div>
        </div>
        <div className="glass rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs md:text-sm text-gray-400">Active Staking</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-white font-mono">{formatCurrency(stats?.active_staking || 0)}</div>
        </div>
        <div className="glass rounded-xl p-4 md:p-5 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-xs md:text-sm text-gray-400">Current Level</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-gradient">Level {stats?.current_level || 1}</div>
        </div>
      </div>

      {/* Level & Progress Section */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
        {/* Current Level Card */}
        <div className="glass rounded-xl p-5 md:p-6" data-testid="current-level-card">
          <h2 className="text-base md:text-lg font-bold text-white mb-4">Current Level Benefits</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="text-gray-400">Level</span>
              <span className="text-xl font-bold text-gradient">Level {stats?.current_level || 1}</span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="text-gray-400">Daily ROI</span>
              <span className="text-green-400 font-bold">{stats?.daily_roi_percentage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="text-gray-400">Package</span>
              <span className="text-white font-bold">{currentPackage?.name || `Level ${stats?.current_level}`}</span>
            </div>
            {currentPackage && currentPackage.level >= 2 && (
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="text-xs text-gray-500 mb-3">Commission Rates</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                    <div className="text-base md:text-lg font-bold text-blue-400">{currentPackage.commission_direct || currentPackage.commission_lv_a || 0}%</div>
                    <div className="text-xs text-gray-500">Direct</div>
                  </div>
                  <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                    <div className="text-base md:text-lg font-bold text-purple-400">{currentPackage.commission_level_2 || currentPackage.commission_lv_b || 0}%</div>
                    <div className="text-xs text-gray-500">Lv.2</div>
                  </div>
                  <div className="text-center p-2 bg-violet-500/10 rounded-lg">
                    <div className="text-base md:text-lg font-bold text-violet-400">{currentPackage.commission_level_3 || currentPackage.commission_lv_c || 0}%</div>
                    <div className="text-xs text-gray-500">Lv.3</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Level Progress */}
        <div className="glass rounded-xl p-5 md:p-6" data-testid="next-level-card">
          <h2 className="text-base md:text-lg font-bold text-white mb-4">Next Level Progress</h2>
          {stats?.promotion_progress ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm md:text-base">
                <span className="text-gray-400">Target Level</span>
                <span className="text-xl font-bold text-gradient">Level {stats?.next_level_requirements?.level}</span>
              </div>
              
              {/* Investment Requirement */}
              <div className="flex items-center justify-between text-sm md:text-base">
                <span className="text-gray-400">Min Investment</span>
                <span className={`font-bold ${stats.promotion_progress.investment_met ? 'text-green-400' : 'text-yellow-400'}`}>
                  {formatCurrency(stats.promotion_progress.investment_current)} / {formatCurrency(stats.promotion_progress.investment_required)}
                </span>
              </div>
              
              {/* Direct Referrals */}
              {stats.promotion_progress.direct_required > 0 && (
                <div className="flex items-center justify-between text-sm md:text-base">
                  <span className="text-gray-400">Direct Team (Lv.1)</span>
                  <span className={`font-bold ${stats.promotion_progress.direct_met ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats.promotion_progress.direct_current} / {stats.promotion_progress.direct_required}
                  </span>
                </div>
              )}
              
              {/* Level 2 Team */}
              {stats.promotion_progress.level_2_required > 0 && (
                <div className="flex items-center justify-between text-sm md:text-base">
                  <span className="text-gray-400">Lv.2 Team</span>
                  <span className={`font-bold ${stats.promotion_progress.level_2_met ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats.promotion_progress.level_2_current} / {stats.promotion_progress.level_2_required}
                  </span>
                </div>
              )}
              
              {/* Level 3 Team */}
              {stats.promotion_progress.level_3_required > 0 && (
                <div className="flex items-center justify-between text-sm md:text-base">
                  <span className="text-gray-400">Lv.3 Team</span>
                  <span className={`font-bold ${stats.promotion_progress.level_3_met ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats.promotion_progress.level_3_current} / {stats.promotion_progress.level_3_required}
                  </span>
                </div>
              )}
              
              {/* Level 4 Team */}
              {stats.promotion_progress.level_4_required > 0 && (
                <div className="flex items-center justify-between text-sm md:text-base">
                  <span className="text-gray-400">Lv.4 Team</span>
                  <span className={`font-bold ${stats.promotion_progress.level_4_met ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats.promotion_progress.level_4_current} / {stats.promotion_progress.level_4_required}
                  </span>
                </div>
              )}
              
              {/* Level 5 Team */}
              {stats.promotion_progress.level_5_required > 0 && (
                <div className="flex items-center justify-between text-sm md:text-base">
                  <span className="text-gray-400">Lv.5 Team</span>
                  <span className={`font-bold ${stats.promotion_progress.level_5_met ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats.promotion_progress.level_5_current} / {stats.promotion_progress.level_5_required}
                  </span>
                </div>
              )}
              
              {/* Level 6 Team */}
              {stats.promotion_progress.level_6_required > 0 && (
                <div className="flex items-center justify-between text-sm md:text-base">
                  <span className="text-gray-400">Lv.6 Team</span>
                  <span className={`font-bold ${stats.promotion_progress.level_6_met ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats.promotion_progress.level_6_current} / {stats.promotion_progress.level_6_required}
                  </span>
                </div>
              )}
              
              {/* All Requirements Status */}
              <div className="border-t border-white/10 pt-4 mt-4">
                {stats.promotion_progress.all_requirements_met ? (
                  <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="text-green-400 font-bold">✓ Ready for Promotion!</div>
                    <div className="text-xs text-gray-400 mt-1">All requirements met</div>
                  </div>
                ) : (
                  <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="text-yellow-400 font-bold">Requirements Pending</div>
                    <div className="text-xs text-gray-400 mt-1">Complete all requirements to level up</div>
                  </div>
                )}
              </div>
            </div>
          ) : nextPackage ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm md:text-base">
                <span className="text-gray-400">Target Level</span>
                <span className="text-xl font-bold text-gradient">Level {nextPackage.level}</span>
              </div>
              <div className="flex items-center justify-between text-sm md:text-base">
                <span className="text-gray-400">Min Investment</span>
                <span className="text-white font-bold font-mono">{formatCurrency(nextPackage.min_investment)}</span>
              </div>
              <div className="flex items-center justify-between text-sm md:text-base">
                <span className="text-gray-400">Direct Referrals</span>
                <span className={`font-bold ${stats?.direct_referrals >= nextPackage.direct_required ? 'text-green-400' : 'text-yellow-400'}`}>
                  {stats?.direct_referrals || 0} / {nextPackage.direct_required || 0}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🏆</div>
              <div className="text-lg text-white font-bold">Maximum Level!</div>
              <div className="text-gray-400 text-sm mt-1">You're at the highest tier</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link to="/deposit" className="glass rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
          <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <span className="text-white font-bold text-sm">Deposit</span>
        </Link>
        <Link to="/staking" className="glass rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <span className="text-white font-bold text-sm">Invest</span>
        </Link>
        <Link to="/transactions" className="glass rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
          <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <span className="text-white font-bold text-sm">History</span>
        </Link>
        <Link to="/team" className="glass rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
          <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <span className="text-white font-bold text-sm">Team</span>
        </Link>
      </div>
    </div>
  );
};

export default UserDashboard;
