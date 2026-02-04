import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Clock, Filter, TrendingUp, Gift, Wallet, DollarSign } from 'lucide-react';
import { userAPI } from '@/api';
import { formatCurrency } from '@/utils';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await userAPI.getTransactions();
      setTransactions(response.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-5 h-5" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5" />;
      case 'roi':
        return <TrendingUp className="w-5 h-5" />;
      case 'commission':
        return <Gift className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'deposit':
        return 'text-green-400 bg-green-500/10';
      case 'withdrawal':
        return 'text-red-400 bg-red-500/10';
      case 'roi':
        return 'text-blue-400 bg-blue-500/10';
      case 'commission':
        return 'text-purple-400 bg-purple-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      approved: 'bg-green-500/10 text-green-400 border-green-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate summaries
  const summary = {
    totalDeposits: transactions.filter(t => t.type === 'deposit' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalROI: transactions.filter(t => t.type === 'roi').reduce((sum, t) => sum + t.amount, 0),
    totalCommissions: transactions.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8" data-testid="transactions-page">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Transaction History</h1>
        <p className="text-gray-400 text-sm md:text-base">View all your transactions in one place</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 md:p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <ArrowDownRight className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-xs md:text-sm text-gray-400">Deposits</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-white font-mono">{formatCurrency(summary.totalDeposits)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 md:p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs md:text-sm text-gray-400">Withdrawals</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-white font-mono">{formatCurrency(summary.totalWithdrawals)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 md:p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs md:text-sm text-gray-400">ROI Earned</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-white font-mono">{formatCurrency(summary.totalROI)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-4 md:p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Gift className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs md:text-sm text-gray-400">Commissions</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-white font-mono">{formatCurrency(summary.totalCommissions)}</div>
        </motion.div>
      </div>

      {/* Filter and Transaction List */}
      <div className="glass rounded-xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white">All Transactions</h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-900/50 border-gray-800 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="roi">ROI Earnings</SelectItem>
              <SelectItem value="commission">Commissions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx, idx) => (
              <motion.div
                key={tx.transaction_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2 md:p-3 rounded-xl ${getTypeColor(tx.type)}`}>
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm md:text-base capitalize">{tx.type}</p>
                    <p className="text-gray-500 text-xs md:text-sm truncate max-w-[150px] md:max-w-[300px]">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-600 text-xs">{formatDate(tx.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-base md:text-lg font-bold font-mono ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
