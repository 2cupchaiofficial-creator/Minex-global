import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertCircle, CheckCircle, Clock, Calendar, Wallet, Info } from 'lucide-react';
import { withdrawalAPI, settingsAPI } from '@/api';
import { formatCurrency, formatDateTime } from '@/utils';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';

const WithdrawPage = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    wallet_address: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [chargeDetails, setChargeDetails] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [withdrawalsRes, settingsRes] = await Promise.all([
        withdrawalAPI.getAll(),
        settingsAPI.get()
      ]);
      setWithdrawals(withdrawalsRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const isWithdrawalAllowed = () => {
    if (!settings?.withdrawal_dates || settings.withdrawal_dates.length === 0) {
      return true; // No restrictions
    }
    const today = new Date().getDate();
    return settings.withdrawal_dates.includes(today);
  };

  const getNextWithdrawalDate = () => {
    if (!settings?.withdrawal_dates || settings.withdrawal_dates.length === 0) {
      return null;
    }
    const today = new Date().getDate();
    const sortedDates = [...settings.withdrawal_dates].sort((a, b) => a - b);
    
    // Find the next date after today
    const nextDate = sortedDates.find(d => d > today);
    if (nextDate) return nextDate;
    
    // If no date found, return first date of next month
    return sortedDates[0];
  };

  // Calculate withdrawable balance (ROI + Commission)
  const withdrawableBalance = (user?.roi_balance || 0) + (user?.commission_balance || 0);

  const calculateCharges = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount <= 0) return null;
    
    const chargeType = settings?.withdrawal_charge_type || 'percentage';
    const chargeValue = settings?.withdrawal_charge_value || 0;
    
    let charge = 0;
    if (chargeType === 'percentage') {
      charge = amount * (chargeValue / 100);
    } else {
      charge = chargeValue;
    }
    
    const netAmount = amount - charge;
    
    return {
      grossAmount: amount,
      chargeType,
      chargeValue,
      charge,
      netAmount
    };
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    
    if (!isWithdrawalAllowed()) {
      toast.error(`Withdrawals are only allowed on days: ${settings?.withdrawal_dates?.join(', ')}`);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount > withdrawableBalance) {
      toast.error('Amount exceeds withdrawable balance');
      return;
    }

    const charges = calculateCharges();
    if (charges) {
      setChargeDetails(charges);
      setShowConfirmation(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isWithdrawalAllowed()) {
      toast.error(`Withdrawals are only allowed on days: ${settings?.withdrawal_dates?.join(', ')}`);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount > withdrawableBalance) {
      toast.error('Amount exceeds withdrawable balance');
      return;
    }

    setLoading(true);

    try {
      await withdrawalAPI.create({
        amount: amount,
        wallet_address: formData.wallet_address
      });

      toast.success('Withdrawal request submitted!');
      setShowForm(false);
      setShowConfirmation(false);
      setChargeDetails(null);
      setFormData({ amount: '', wallet_address: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const withdrawalAllowed = isWithdrawalAllowed();
  const nextDate = getNextWithdrawalDate();

  return (
    <div className="space-y-6 md:space-y-8" data-testid="withdraw-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="withdraw-title">Withdrawals</h1>
          <p className="text-gray-400 text-sm md:text-base">Request withdrawals from your earnings</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={!withdrawalAllowed}
          className={`btn-primary w-full sm:w-auto ${!withdrawalAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
          data-testid="new-withdrawal-btn"
        >
          {showForm ? 'Cancel' : 'New Withdrawal'}
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="glass rounded-xl p-4 md:p-5" data-testid="balance-info">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            <span className="text-xs md:text-sm text-gray-400">Withdrawable Balance</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-white font-mono" data-testid="available-balance">
            {formatCurrency(withdrawableBalance)}
          </div>
          <div className="text-xs text-gray-500 mt-1">ROI + Commissions</div>
        </div>
        
        <div className="glass rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            <span className="text-xs md:text-sm text-gray-400">Withdrawal Status</span>
          </div>
          {withdrawalAllowed ? (
            <>
              <div className="text-xl md:text-2xl font-bold text-green-400">Available</div>
              <div className="text-xs text-gray-500 mt-1">You can withdraw today</div>
            </>
          ) : (
            <>
              <div className="text-xl md:text-2xl font-bold text-yellow-400">Restricted</div>
              <div className="text-xs text-gray-500 mt-1">
                Next: Day {nextDate} of month
              </div>
            </>
          )}
        </div>
      </div>

      {/* Withdrawal Dates Notice */}
      {settings?.withdrawal_dates && settings.withdrawal_dates.length > 0 && (
        <div className="glass rounded-xl p-4 bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Withdrawal Schedule</p>
              <p className="text-xs text-gray-400 mt-1">
                Withdrawals are available on these days of the month: <span className="text-blue-400 font-bold">{settings.withdrawal_dates.join(', ')}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && withdrawalAllowed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5 md:p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
          data-testid="withdrawal-form"
        >
          <h2 className="text-lg md:text-xl font-bold text-white mb-5">Request Withdrawal</h2>

          <form onSubmit={handlePreSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                placeholder="Enter amount"
                max={withdrawableBalance}
                required
                data-testid="withdrawal-amount-input"
              />
              <div className="text-xs text-gray-500 mt-2">
                Maximum: {formatCurrency(withdrawableBalance)}
              </div>
              {settings?.withdrawal_charge_value > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  Note: A {settings.withdrawal_charge_type === 'percentage' ? `${settings.withdrawal_charge_value}%` : `$${settings.withdrawal_charge_value}`} withdrawal charge will be applied
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">USDT Wallet Address (TRC20)</label>
              <input
                type="text"
                value={formData.wallet_address}
                onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white font-mono text-sm"
                placeholder="Enter your USDT wallet address"
                required
                data-testid="wallet-address-input"
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <div className="font-bold mb-1">Important Notice</div>
                  <ul className="text-xs space-y-1 text-gray-400">
                    <li>• Withdrawal requests are processed manually by admin</li>
                    <li>• Please ensure your wallet address is correct (TRC20 network)</li>
                    <li>• Processing time: 24-48 hours</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
              data-testid="submit-withdrawal-btn"
            >
              <Send className="w-5 h-5" />
              {loading ? 'Submitting...' : 'Review & Submit Request'}
            </button>
          </form>

          {/* Confirmation Modal */}
          {showConfirmation && chargeDetails && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" data-testid="withdrawal-confirmation-modal">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-white mb-4">Confirm Withdrawal</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Withdrawal Amount</span>
                    <span className="text-white font-bold">{formatCurrency(chargeDetails.grossAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">
                      Charge ({chargeDetails.chargeType === 'percentage' ? `${chargeDetails.chargeValue}%` : 'Fixed'})
                    </span>
                    <span className="text-red-400 font-bold">-{formatCurrency(chargeDetails.charge)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 bg-green-500/10 rounded-lg px-3">
                    <span className="text-green-400 font-medium">You Will Receive</span>
                    <span className="text-green-400 font-bold text-xl">{formatCurrency(chargeDetails.netAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">To Wallet</span>
                    <span className="text-white font-mono text-xs">{formData.wallet_address.substring(0, 15)}...</span>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-200">
                      By confirming, you agree that the withdrawal charge will be deducted from your withdrawal amount.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmation(false);
                      setChargeDetails(null);
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 btn-primary"
                    data-testid="confirm-withdrawal-btn"
                  >
                    {loading ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      <div className="glass rounded-xl p-5 md:p-6" data-testid="withdrawal-history">
        <h2 className="text-lg md:text-xl font-bold text-white mb-5">Withdrawal History</h2>
        
        {withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <Send className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No withdrawals yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div 
                key={withdrawal.withdrawal_id} 
                className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg"
                data-testid={`withdrawal-row-${withdrawal.withdrawal_id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    withdrawal.status === 'approved' ? 'bg-green-500/10' :
                    withdrawal.status === 'rejected' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                  }`}>
                    {getStatusIcon(withdrawal.status)}
                  </div>
                  <div>
                    <p className="text-white font-bold font-mono">{formatCurrency(withdrawal.amount)}</p>
                    <p className="text-gray-500 text-xs">{formatDateTime(withdrawal.created_at)}</p>
                    <p className="text-gray-600 text-xs font-mono mt-1 hidden md:block">
                      To: {withdrawal.wallet_address.substring(0, 20)}...
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold capitalize ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status}
                  </span>
                  {withdrawal.transaction_hash && (
                    <p className="text-xs text-green-400 mt-1 font-mono">
                      TX: {withdrawal.transaction_hash.substring(0, 10)}...
                    </p>
                  )}
                  {withdrawal.rejection_reason && (
                    <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate">
                      {withdrawal.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;
