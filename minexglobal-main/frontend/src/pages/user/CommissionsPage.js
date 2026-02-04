import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, TrendingUp, Users } from 'lucide-react';
import { commissionAPI } from '@/api';
import { formatCurrency, formatDateTime } from '@/utils';
import { toast } from 'sonner';

const CommissionsPage = () => {
  const [data, setData] = useState({ 
    commissions: [], 
    summary: { 
      level_1: 0, level_2: 0, level_3: 0, level_4: 0, level_5: 0, level_6: 0,
      lv_a: 0, lv_b: 0, lv_c: 0, total: 0 
    } 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      const response = await commissionAPI.getAll();
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getLevelColor = (level) => {
    const colors = {
      1: 'text-blue-400 bg-blue-500/10',
      2: 'text-purple-400 bg-purple-500/10',
      3: 'text-violet-400 bg-violet-500/10',
      4: 'text-pink-400 bg-pink-500/10',
      5: 'text-orange-400 bg-orange-500/10',
      6: 'text-yellow-400 bg-yellow-500/10',
    };
    return colors[level] || colors[1];
  };

  return (
    <div className="space-y-6 md:space-y-8" data-testid="commissions-page">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="commissions-title">Commissions</h1>
        <p className="text-gray-400 text-sm md:text-base">Track your earnings from referrals across 6 levels</p>
      </div>

      {/* Total Commission */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-5 md:p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
        data-testid="total-commission-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Total Commission Earned</span>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-white font-mono" data-testid="total-commission-value">
              {formatCurrency(data.summary.total)}
            </div>
          </div>
          <div className="hidden md:block">
            <TrendingUp className="w-12 h-12 text-green-400" />
          </div>
        </div>
      </motion.div>

      {/* 6-Level Commission Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6].map((level, idx) => (
          <motion.div
            key={level}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass rounded-xl p-4"
            data-testid={`level-${level}-card`}
          >
            <div className={`text-xs font-bold mb-2 px-2 py-1 rounded-full inline-block ${getLevelColor(level)}`}>
              Level {level}
            </div>
            <div className="text-lg md:text-xl font-bold text-white font-mono">
              {formatCurrency(data.summary[`level_${level}`] || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {level === 1 ? 'Direct' : `${level}nd Level`}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Commission History */}
      <div className="glass rounded-xl p-5 md:p-6" data-testid="commission-history">
        <h2 className="text-lg md:text-xl font-bold text-white mb-5">Commission History</h2>
        
        {data.commissions.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No commissions earned yet</p>
            <p className="text-gray-600 text-sm mt-1">Build your team to start earning commissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.commissions.map((commission) => {
              const levelNum = commission.level_depth || 1;
              const levelColor = getLevelColor(levelNum);
              
              return (
                <motion.div 
                  key={commission.commission_id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg hover:bg-white/10 transition"
                  data-testid={`commission-row-${commission.commission_id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${levelColor.split(' ')[1]}`}>
                      <Gift className={`w-4 h-4 ${levelColor.split(' ')[0]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColor}`}>
                          Level {levelNum}
                        </span>
                        <span className="text-green-400 text-xs font-bold">{commission.percentage}%</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        From: {commission.from_user_name || commission.from_user_id?.substring(0, 8) + '...'}
                      </p>
                      <p className="text-gray-600 text-xs">{formatDateTime(commission.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white font-mono">
                      +{formatCurrency(commission.amount)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="glass rounded-xl p-5 bg-blue-500/5 border border-blue-500/20">
        <h3 className="text-sm font-bold text-white mb-3">How Commissions Work</h3>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <p className="font-bold text-blue-400 mb-1">6-Level Deep Commissions</p>
            <p>Earn commissions from investments made by your team up to 6 levels deep.</p>
          </div>
          <div>
            <p className="font-bold text-purple-400 mb-1">Package-Based Rates</p>
            <p>Your commission rates depend on your current investment package level.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionsPage;
