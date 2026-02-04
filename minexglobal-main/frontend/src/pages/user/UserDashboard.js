import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Users, Gift, ArrowUpRight, DollarSign, Zap, Target } from 'lucide-react';
import { userAPI, membershipAPI } from '@/api';
import { formatCurrency } from '@/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, packagesRes] = await Promise.all([
        userAPI.getDashboard(),
        membershipAPI.getPackages()
      ]);
      setStats(statsRes.data);
      setPackages(packagesRes.data);
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
