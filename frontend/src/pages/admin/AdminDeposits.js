import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api';
import { formatCurrency, formatDateTime } from '@/utils';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    try {
      const response = await adminAPI.getDeposits();
      setDeposits(response.data);
    } catch (error) {
      toast.error('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (depositId) => {
    if (!window.confirm('Approve this deposit? This will credit the user and distribute commissions.')) {
      return;
    }

    try {
      await adminAPI.approveDeposit(depositId);
      toast.success('Deposit approved successfully!');
      loadDeposits();
      setShowDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve deposit');
    }
  };

  const handleReject = async (depositId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await adminAPI.rejectDeposit(depositId, reason);
      toast.success('Deposit rejected');
      loadDeposits();
      setShowDialog(false);
    } catch (error) {
      toast.error('Failed to reject deposit');
    }
  };

  const filteredDeposits = deposits.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-deposits">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="deposits-title">Manage Deposits</h1>
          <p className="text-gray-400">Review and approve deposit requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            data-testid="filter-all"
          >
            All ({deposits.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            data-testid="filter-pending"
          >
            Pending ({deposits.filter(d => d.status === 'pending').length})
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-8" data-testid="deposits-table">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">User</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Amount</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No deposits found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((deposit) => (
                  <tr key={deposit.deposit_id} className="border-b border-white/5 hover:bg-white/5" data-testid={`deposit-row-${deposit.deposit_id}`}>
                    <td className="py-4 px-4 text-gray-300 text-sm">{formatDateTime(deposit.created_at)}</td>
                    <td className="py-4 px-4">
                      <div className="text-white font-medium">{deposit.user_name || 'Unknown'}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{deposit.user_email || 'N/A'}</td>
                    <td className="py-4 px-4 text-white font-mono font-bold">{formatCurrency(deposit.amount)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        deposit.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        deposit.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {deposit.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDeposit(deposit);
                            setShowDialog(true);
                          }}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition"
                          data-testid={`view-deposit-${deposit.deposit_id}`}
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        {deposit.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(deposit.deposit_id)}
                              className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition"
                              data-testid={`approve-deposit-${deposit.deposit_id}`}
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              onClick={() => handleReject(deposit.deposit_id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition"
                              data-testid={`reject-deposit-${deposit.deposit_id}`}
                            >
                              <XCircle className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-950 border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="deposit-detail-dialog">
          {selectedDeposit && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex justify-between items-center">
                  <DialogTitle className="text-2xl text-white">Deposit Details</DialogTitle>
                  <button
                    onClick={() => setShowDialog(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition"
                    data-testid="close-deposit-dialog"
                  >
                    <XCircle className="w-5 h-5 text-gray-400 hover:text-white" />
                  </button>
                </div>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 pr-2 space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Amount</div>
                    <div className="text-xl text-white font-mono font-bold">{formatCurrency(selectedDeposit.amount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Status</div>
                    <div className="text-xl text-white capitalize">{selectedDeposit.status}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">User</div>
                    <div className="text-sm text-white">{selectedDeposit.user_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{selectedDeposit.user_email || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Created At</div>
                    <div className="text-sm text-white">{formatDateTime(selectedDeposit.created_at)}</div>
                  </div>
                </div>

                {selectedDeposit.transaction_hash && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Transaction Hash</div>
                    <div className="bg-gray-900/50 rounded-lg px-4 py-2 text-white font-mono text-sm break-all">
                      {selectedDeposit.transaction_hash}
                    </div>
                  </div>
                )}

                {selectedDeposit.screenshot_url && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Transaction Screenshot</div>
                    <div className="border border-white/10 rounded-lg p-2 max-h-[400px] overflow-y-auto">
                      <img 
                        src={selectedDeposit.screenshot_url} 
                        alt="Transaction" 
                        className="w-full h-auto rounded cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(selectedDeposit.screenshot_url, '_blank')}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Click image to open full size</p>
                  </div>
                )}

                {selectedDeposit.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleApprove(selectedDeposit.deposit_id)}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                      data-testid="dialog-approve-btn"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Deposit
                    </button>
                    <button
                      onClick={() => handleReject(selectedDeposit.deposit_id)}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-6 py-3 font-bold flex items-center justify-center gap-2"
                      data-testid="dialog-reject-btn"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeposits;
