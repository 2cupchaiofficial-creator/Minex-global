import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api';
import { formatCurrency, formatDateTime } from '@/utils';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

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

  const filteredWithdrawals = withdrawals.filter(w => {
    if (filter === 'all') return true;
    return w.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-withdrawals">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="withdrawals-title">Manage Withdrawals</h1>
          <p className="text-gray-400">Review and process withdrawal requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            data-testid="filter-all"
          >
            All ({withdrawals.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            data-testid="filter-pending"
          >
            Pending ({withdrawals.filter(w => w.status === 'pending').length})
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-8" data-testid="withdrawals-table">
        <div className="overflow-x-auto">
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
                    <td className="py-4 px-4 text-gray-400 font-mono text-xs">{withdrawal.wallet_address.substring(0, 16)}...</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        withdrawal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        withdrawal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(withdrawal.withdrawal_id)}
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition"
                            data-testid={`approve-withdrawal-${withdrawal.withdrawal_id}`}
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.withdrawal_id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition"
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
      </div>
    </div>
  );
};

export default AdminWithdrawals;
