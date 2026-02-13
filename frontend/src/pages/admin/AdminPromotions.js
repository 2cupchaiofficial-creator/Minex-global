import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api';
import { toast } from 'sonner';
import { Gift, Plus, Edit, Trash2, Eye, Calendar, Percent, Users, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString();
};

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [showRewards, setShowRewards] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    self_deposit_reward_percent: 0,
    direct_referral_reward_percent: 0,
    is_active: true
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await adminAPI.getPromotions();
      setPromotions(response.data || []);
    } catch (error) {
      console.error('Failed to load promotions', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPromotion) {
        await adminAPI.updatePromotion(editingPromotion.promotion_id, formData);
        toast.success('Promotion updated successfully!');
      } else {
        await adminAPI.createPromotion(formData);
        toast.success('Promotion created successfully!');
      }
      setShowForm(false);
      setEditingPromotion(null);
      resetForm();
      loadPromotions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromotion(promo);
    setFormData({
      name: promo.name,
      start_date: promo.start_date?.split('T')[0] || '',
      end_date: promo.end_date?.split('T')[0] || '',
      self_deposit_reward_percent: promo.self_deposit_reward_percent,
      direct_referral_reward_percent: promo.direct_referral_reward_percent,
      is_active: promo.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      await adminAPI.deletePromotion(promotionId);
      toast.success('Promotion deleted');
      loadPromotions();
    } catch (error) {
      toast.error('Failed to delete promotion');
    }
  };

  const handleViewRewards = async (promotionId) => {
    try {
      const response = await adminAPI.getPromotionRewards(promotionId);
      setRewards(response.data);
      setShowRewards(promotionId);
    } catch (error) {
      toast.error('Failed to load rewards');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      self_deposit_reward_percent: 0,
      direct_referral_reward_percent: 0,
      is_active: true
    });
  };

  const isPromotionActive = (promo) => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    return promo.is_active && now >= start && now <= end;
  };

  const handleMigrateRewards = async () => {
    if (!window.confirm('This will migrate past promotion rewards to transaction history. Continue?')) return;
    
    setMigrateLoading(true);
    try {
      const response = await adminAPI.migratePromoRewards();
      toast.success(`Migration complete: ${response.data.migrated} migrated, ${response.data.skipped} skipped`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to migrate rewards');
    } finally {
      setMigrateLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-promotions">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Promotions</h1>
          <p className="text-gray-400 text-sm">Manage promotional rewards for deposits</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingPromotion(null); resetForm(); }}
          className="btn-primary flex items-center gap-2"
          data-testid="new-promotion-btn"
        >
          <Plus className="w-5 h-5" />
          New Promotion
        </button>
      </div>

      {/* Promotion Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-white mb-6">
              {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Promotion Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                  placeholder="e.g., New Year Bonus"
                  required
                  data-testid="promo-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                    required
                    data-testid="promo-start-date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                    required
                    data-testid="promo-end-date"
                  />
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Self Deposit Reward
                </h3>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Reward Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.self_deposit_reward_percent}
                    onChange={(e) => setFormData({ ...formData, self_deposit_reward_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-green-500 rounded-lg px-4 py-3 text-white"
                    data-testid="self-reward-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">User gets this % of their deposit as reward</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Direct Referral Reward
                </h3>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Reward Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.direct_referral_reward_percent}
                    onChange={(e) => setFormData({ ...formData, direct_referral_reward_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                    data-testid="referral-reward-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Referrer gets this % when their direct referral deposits</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-white">Active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingPromotion(null); }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                  data-testid="save-promotion-btn"
                >
                  {loading ? 'Saving...' : (editingPromotion ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Rewards Modal */}
      {showRewards && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Promotion Rewards</h2>
              <button onClick={() => setShowRewards(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-500/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{formatCurrency(rewards.total_distributed)}</div>
                <div className="text-xs text-gray-400">Total Distributed</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{rewards.total_count}</div>
                <div className="text-xs text-gray-400">Total Rewards</div>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {rewards.rewards?.map((reward) => (
                <div key={reward.reward_id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{reward.user_email}</div>
                      <div className="text-xs text-gray-400">
                        {reward.reward_type === 'self' ? 'Self Deposit Reward' : `Referral Reward from ${reward.from_user_email}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{formatCurrency(reward.reward_amount)}</div>
                      <div className="text-xs text-gray-500">{reward.reward_percent}% of {formatCurrency(reward.deposit_amount)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {(!rewards.rewards || rewards.rewards.length === 0) && (
                <div className="text-center py-8 text-gray-500">No rewards distributed yet</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Promotions List */}
      <div className="grid gap-4">
        {promotions.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No promotions created yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first promotion to offer rewards</p>
          </div>
        ) : (
          promotions.map((promo) => (
            <motion.div
              key={promo.promotion_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-xl p-5 ${isPromotionActive(promo) ? 'ring-2 ring-green-500' : ''}`}
              data-testid={`promotion-${promo.promotion_id}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Gift className={`w-5 h-5 ${isPromotionActive(promo) ? 'text-green-400' : 'text-gray-500'}`} />
                    <h3 className="text-lg font-bold text-white">{promo.name}</h3>
                    {isPromotionActive(promo) && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full animate-pulse">
                        ACTIVE
                      </span>
                    )}
                    {!promo.is_active && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold rounded-full">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-green-400">
                      <DollarSign className="w-4 h-4" />
                      Self: {promo.self_deposit_reward_percent}%
                    </div>
                    <div className="flex items-center gap-1 text-blue-400">
                      <Users className="w-4 h-4" />
                      Referral: {promo.direct_referral_reward_percent}%
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewRewards(promo.promotion_id)}
                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition"
                    title="View Rewards"
                  >
                    <Eye className="w-5 h-5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleEdit(promo)}
                    className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5 text-yellow-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(promo.promotion_id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPromotions;
