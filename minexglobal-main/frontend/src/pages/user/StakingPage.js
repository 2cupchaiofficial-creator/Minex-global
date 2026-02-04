import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, Clock, AlertCircle, ArrowRight, TrendingUp, Wallet } from 'lucide-react';
import { investmentAPI, depositAPI } from '@/api';
import { formatCurrency, formatDateTime, getRemainingTime } from '@/utils';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';
import { useNavigate } from 'react-router-dom';

const StakingPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [userStakes, setUserStakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [hasDeposit, setHasDeposit] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      const [packagesRes, stakesRes, depositsRes] = await Promise.all([
        investmentAPI.getPackages(),
        investmentAPI.getUserInvestments(),
        depositAPI.getAll()
      ]);
      setPackages(packagesRes.data);
      setUserStakes(stakesRes.data);
      // Check if user has approved deposits
      const approvedDeposits = depositsRes.data.filter(d => d.status === 'approved');
      setHasDeposit(approvedDeposits.length > 0);
    } catch (error) {
      toast.error('Failed to load investment data');
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    
    if (!hasDeposit) {
      toast.error('Please make a deposit first before investing');
      navigate('/deposit');
      return;
    }

    if (!selectedPackage) return;
    
    const amount = parseFloat(stakeAmount);
    if (amount > (user?.wallet_balance || 0)) {
      toast.error('Insufficient balance. Please deposit more funds.');
      return;
    }

    setLoading(true);

    try {
      await investmentAPI.create({
        package_id: selectedPackage.package_id,
        amount: amount
      });

      toast.success('Investment activated successfully! You will start earning ROI daily.');
      setSelectedPackage(null);
      setStakeAmount('');
      
      // Refresh user data
      if (refreshUser) await refreshUser();
      
      // Redirect to dashboard after successful investment
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create investment');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    if (!hasDeposit) {
      toast.error('Please make a deposit first before investing');
      navigate('/deposit');
      return;
    }
    setSelectedPackage(pkg);
    setStakeAmount(pkg.min_investment.toString());
  };

  return (
    <div className="space-y-6 md:space-y-8" data-testid="staking-page">
      {initialLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading investment packages...</p>
          </div>
        </div>
      ) : (
        <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="staking-title">Invest & Earn</h1>
        <p className="text-gray-400 text-sm md:text-base">Choose an investment package and earn daily ROI</p>
      </div>

      {/* Balance Card */}
      <div className="glass rounded-xl p-5 md:p-6" data-testid="balance-info">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Available Balance</div>
            <div className="text-2xl md:text-3xl font-bold text-white font-mono" data-testid="available-balance">
              {formatCurrency(user?.wallet_balance || 0)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-gray-400">Current Level</div>
              <div className="text-lg font-bold text-blue-400">Level {user?.level || 1}</div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>
        
        {!hasDeposit && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-sm font-medium">Deposit Required</p>
              <p className="text-gray-400 text-xs mt-1">You need to make a deposit before you can invest.</p>
              <button
                onClick={() => navigate('/deposit')}
                className="text-blue-400 text-xs mt-2 flex items-center gap-1 hover:text-blue-300"
              >
                Go to Deposit <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Investment Packages */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white mb-4">Investment Packages</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {packages.map((pkg, idx) => (
            <motion.div
              key={pkg.package_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedPackage?.package_id === pkg.package_id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handlePackageSelect(pkg)}
              data-testid={`investment-package-${pkg.level}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full">
                  <span className="text-xs font-bold text-white">Level {pkg.level}</span>
                </div>
                {pkg.level === user?.level && (
                  <span className="text-xs text-green-400 font-bold">Your Level</span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{pkg.name || `Level ${pkg.level} Package`}</h3>
              
              <div className="text-xl md:text-2xl font-bold text-gradient mb-4">
                {formatCurrency(pkg.min_investment)} - {formatCurrency(pkg.max_investment || pkg.min_investment * 10)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Daily ROI</span>
                  <span className="text-green-400 font-bold">{pkg.daily_roi}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Annual ROI</span>
                  <span className="text-blue-400 font-bold">{pkg.annual_roi}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-bold">{pkg.duration_days || 365} days</span>
                </div>
              </div>

              {pkg.level >= 2 && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs text-gray-500 mb-2">Commission Rates</p>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center p-2 bg-blue-500/10 rounded">
                      <div className="text-sm font-bold text-blue-400">{pkg.commission_direct || pkg.commission_lv_a || 0}%</div>
                      <div className="text-xs text-gray-500">Direct</div>
                    </div>
                    <div className="flex-1 text-center p-2 bg-purple-500/10 rounded">
                      <div className="text-sm font-bold text-purple-400">{pkg.commission_level_2 || pkg.commission_lv_b || 0}%</div>
                      <div className="text-xs text-gray-500">Lv.2</div>
                    </div>
                    <div className="flex-1 text-center p-2 bg-violet-500/10 rounded">
                      <div className="text-sm font-bold text-violet-400">{pkg.commission_level_3 || pkg.commission_lv_c || 0}%</div>
                      <div className="text-xs text-gray-500">Lv.3</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                className="w-full mt-4 btn-primary text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePackageSelect(pkg);
                }}
                data-testid={`invest-now-btn-${pkg.level}`}
              >
                Invest Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Investment Form */}
      {selectedPackage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5 md:p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
          data-testid="staking-form"
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg md:text-xl font-bold text-white">
              Invest in {selectedPackage.name || `Level ${selectedPackage.level} Package`}
            </h2>
            <button
              onClick={() => setSelectedPackage(null)}
              className="text-gray-400 hover:text-white p-2"
              data-testid="close-form-btn"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleStake} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Investment Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                placeholder={`Min: ${formatCurrency(selectedPackage.min_investment)}, Max: ${formatCurrency(selectedPackage.max_investment || selectedPackage.min_investment * 10)}`}
                min={selectedPackage.min_investment}
                max={Math.min(selectedPackage.max_investment || selectedPackage.min_investment * 10, user?.wallet_balance || 0)}
                required
                data-testid="stake-amount-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {formatCurrency(user?.wallet_balance || 0)}
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-sm font-bold text-white mb-3">Investment Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Package</div>
                  <div className="text-white font-bold">{selectedPackage.name || `Level ${selectedPackage.level}`}</div>
                </div>
                <div>
                  <div className="text-gray-400">Daily ROI</div>
                  <div className="text-green-400 font-bold">{selectedPackage.daily_roi}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Duration</div>
                  <div className="text-white font-bold">{selectedPackage.duration_days || 365} days</div>
                </div>
                <div>
                  <div className="text-gray-400">Estimated Daily Earnings</div>
                  <div className="text-white font-bold font-mono">
                    {stakeAmount ? formatCurrency(parseFloat(stakeAmount) * (selectedPackage.daily_roi / 100)) : '$0.00'}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 mt-4 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Est. Return ({selectedPackage.duration_days || 365} days)</span>
                  <span className="text-green-400 font-bold font-mono">
                    {stakeAmount ? formatCurrency(parseFloat(stakeAmount) * (selectedPackage.daily_roi / 100) * (selectedPackage.duration_days || 365)) : '$0.00'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !hasDeposit}
              className="w-full btn-primary flex items-center justify-center gap-2"
              data-testid="submit-stake-btn"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Activate Investment
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* User Stakes */}
      <div className="glass rounded-xl p-5 md:p-6" data-testid="user-stakes">
        <h2 className="text-lg md:text-xl font-bold text-white mb-5">My Investments</h2>
        
        {userStakes.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No active investments</p>
            <p className="text-gray-600 text-sm mt-1">Select a package above to start investing</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {userStakes.map((stake) => (
              <div key={stake.staking_entry_id} className="bg-white/5 rounded-xl p-4" data-testid={`stake-${stake.staking_entry_id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-bold text-sm">
                      #{stake.staking_entry_id.substring(0, 8)}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    stake.status === 'active' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {stake.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount</span>
                    <span className="text-white font-bold font-mono">{formatCurrency(stake.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily ROI</span>
                    <span className="text-green-400 font-bold">{stake.daily_roi}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Earned</span>
                    <span className="text-white font-bold font-mono">{formatCurrency(stake.total_earned)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">End Date</span>
                    <span className="text-white">{formatDateTime(stake.end_date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 text-sm font-bold">{getRemainingTime(stake.end_date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default StakingPage;
