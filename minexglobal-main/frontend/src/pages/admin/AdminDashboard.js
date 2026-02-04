import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, Clock, Activity, Zap } from 'lucide-react';
import { adminAPI } from '@/api';
import { formatCurrency } from '@/utils';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateROI = async () => {
    if (!window.confirm('This will calculate and distribute daily ROI to all eligible users. Continue?')) {
      return;
    }

    setCalculating(true);
    try {
      const response = await adminAPI.calculateROI();
      toast.success(response.data.message);
      loadStats();
    } catch (error) {
      toast.error('Failed to calculate ROI');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="admin-dashboard-title">Admin Dashboard</h1>
          <p className="text-gray-400">Monitor and manage platform operations</p>
        </div>
        <button
          onClick={handleCalculateROI}
          disabled={calculating}
          className="btn-primary flex items-center gap-2"
          data-testid="calculate-roi-btn"
        >
          <Activity className="w-5 h-5" />
          {calculating ? 'Calculating...' : 'Calculate Daily ROI'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
          data-testid="total-users-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1" data-testid="total-users-value">
            {stats?.total_users || 0}
          </div>
          <div className="text-sm text-blue-200">Total Users</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20"
          data-testid="total-deposits-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 font-mono" data-testid="total-deposits-value">
            {formatCurrency(stats?.total_deposits || 0)}
          </div>
          <div className="text-sm text-green-200">Total Deposits</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
          data-testid="total-withdrawals-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-red-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 font-mono" data-testid="total-withdrawals-value">
            {formatCurrency(stats?.total_withdrawals || 0)}
          </div>
          <div className="text-sm text-red-200">Total Withdrawals</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20"
          data-testid="active-stakes-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1" data-testid="active-stakes-value">
            {stats?.total_active_stakes || 0}
          </div>
          <div className="text-sm text-yellow-200">Active Stakes</div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6" data-testid="pending-actions-card">
          <h2 className="text-xl font-bold text-white mb-6">Pending Actions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-white font-bold">Pending Deposits</div>
                  <div className="text-sm text-gray-400">Require approval</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-400" data-testid="pending-deposits-count">
                {stats?.pending_deposits || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-white font-bold">Pending Withdrawals</div>
                  <div className="text-sm text-gray-400">Require approval</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-400" data-testid="pending-withdrawals-count">
                {stats?.pending_withdrawals || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6" data-testid="financial-summary-card">
          <h2 className="text-xl font-bold text-white mb-6">Financial Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Commissions Paid</span>
              <span className="text-white font-mono font-bold" data-testid="commissions-paid-value">
                {formatCurrency(stats?.total_commissions_paid || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total ROI Paid</span>
              <span className="text-white font-mono font-bold" data-testid="roi-paid-value">
                {formatCurrency(stats?.total_roi_paid || 0)}
              </span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold">Net Balance</span>
                <span className="text-green-400 font-mono font-bold text-xl" data-testid="net-balance-value">
                  {formatCurrency((stats?.total_deposits || 0) - (stats?.total_withdrawals || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
