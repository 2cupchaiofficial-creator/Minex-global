import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api';
import { formatCurrency, formatDateTime } from '@/utils';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowUpRight, User, Wallet, Calendar, Copy } from 'lucide-react';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const response = await adminAPI.getWithdrawals();
      setWithdrawals(response.data);
    } catch (error) {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId) => {
    const transactionHash = window.prompt('Enter transaction hash for completed withdrawal:');
    if (!transactionHash) return;

    try {
      await adminAPI.approveWithdrawal(withdrawalId, transactionHash);
      toast.success('Withdrawal approved successfully!');
      loadWithdrawals();
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleReject = async (withdrawalId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await adminAPI.rejectWithdrawal(withdrawalId, reason);
      toast.success('Withdrawal rejected and balance restored');
      loadWithdrawals();
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (filter === 'all') return true;
    return w.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400'
    };
    return styles[status] || styles.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8" data-testid="admin-withdrawals">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="withdrawals-title">Manage Withdrawals</h1>
          <p className="text-gray-400 text-sm md:text-base">Review and process withdrawal requests</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base whitespace-nowrap min-h-[44px] ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            data-testid="filter-all"
          >
            All ({withdrawals.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base whitespace-nowrap min-h-[44px] ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            data-testid="filter-pending"
          >
            Pending ({withdrawals.filter(w => w.status === 'pending').length})
          </button>
        </div>
      </div>

      <div className="glass rounded-xl md:rounded-2xl p-4 md:p-8" data-testid="withdrawals-table">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">User</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Amount</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Wallet</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.withdrawal_id} className="border-b border-white/5 hover:bg-white/5" data-testid={`withdrawal-row-${withdrawal.withdrawal_id}`}>
                    <td className="py-4 px-4 text-gray-300 text-sm">{formatDateTime(withdrawal.created_at)}</td>
                    <td className="py-4 px-4 text-white font-mono text-sm">{withdrawal.user_id.substring(0, 12)}...</td>
                    <td className="py-4 px-4 text-white font-mono font-bold">{formatCurrency(withdrawal.amount)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-xs">{withdrawal.wallet_address.substring(0, 16)}...</span>
                        <button
                          onClick={() => copyToClipboard(withdrawal.wallet_address)}
                          className="p-1 hover:bg-white/10 rounded transition"
                        >
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusBadge(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(withdrawal.withdrawal_id)}
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                            data-testid={`approve-withdrawal-${withdrawal.withdrawal_id}`}
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.withdrawal_id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                            data-testid={`reject-withdrawal-${withdrawal.withdrawal_id}`}
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No withdrawals found
            </div>
          ) : (
            filteredWithdrawals.map((withdrawal) => (
              <div 
                key={withdrawal.withdrawal_id} 
                className="bg-white/5 rounded-xl p-4 space-y-3"
                data-testid={`withdrawal-card-${withdrawal.withdrawal_id}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold font-mono text-lg">{formatCurrency(withdrawal.amount)}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User & Wallet Info */}
                <div className="bg-black/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <User className="w-4 h-4" />
                    <span className="text-white font-mono text-xs">{withdrawal.user_id.substring(0, 20)}...</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Wallet className="w-4 h-4" />
                    <span className="text-gray-300 font-mono text-xs truncate flex-1">{withdrawal.wallet_address}</span>
                    <button
                      onClick={() => copyToClipboard(withdrawal.wallet_address)}
                      className="p-2 hover:bg-white/10 rounded transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(withdrawal.created_at)}
                </div>

                {/* Actions */}
                {withdrawal.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleApprove(withdrawal.withdrawal_id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition min-h-[48px]"
                      data-testid={`approve-withdrawal-mobile-${withdrawal.withdrawal_id}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(withdrawal.withdrawal_id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition min-h-[48px]"
                      data-testid={`reject-withdrawal-mobile-${withdrawal.withdrawal_id}`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawals;
