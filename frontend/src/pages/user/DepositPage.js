import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { depositAPI, settingsAPI } from '@/api';
import { formatCurrency, formatDateTime, copyToClipboard } from '@/utils';
import { toast } from 'sonner';

const DepositPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'usdt',
    transaction_hash: '',
    screenshot: null
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [depositsRes, settingsRes] = await Promise.all([
        depositAPI.getAll(),
        settingsAPI.get()
      ]);
      setDeposits(depositsRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error('Failed to load deposits');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const depositData = {
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        transaction_hash: formData.transaction_hash,
        screenshot_url: null
      };

      const response = await depositAPI.create(depositData);

      if (formData.screenshot) {
        await depositAPI.uploadScreenshot(response.data.deposit_id, formData.screenshot);
      }

      toast.success('Deposit request submitted successfully!');
      setShowForm(false);
      setFormData({ amount: '', payment_method: 'usdt', transaction_hash: '', screenshot: null });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>;
      case 'rejected':
        return <div className="w-2 h-2 rounded-full bg-red-400"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>;
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

  return (
    <div className="space-y-6 md:space-y-8" data-testid="deposit-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2" data-testid="deposit-title">Deposits</h1>
          <p className="text-gray-400 text-sm md:text-base">Fund your account securely</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary w-full sm:w-auto"
          data-testid="new-deposit-btn"
        >
          {showForm ? 'Cancel' : 'New Deposit'}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
          data-testid="deposit-form"
        >
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Submit Deposit</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="glass rounded-xl p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/15 hover:to-purple-500/15 transition-all" data-testid="usdt-payment-method">
              <h3 className="text-lg font-bold text-white mb-4">USDT Payment</h3>
              <div className="space-y-4">
                {/* Show uploaded QR code if available, otherwise generate one */}
                {(settings?.qr_code_image || settings?.usdt_wallet_address) && (
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white rounded-xl">
                      {settings?.qr_code_image ? (
                        <img src={settings.qr_code_image} alt="Payment QR Code" className="w-[180px] h-[180px] object-contain" />
                      ) : (
                        <QRCodeSVG value={settings?.usdt_wallet_address || ''} size={180} />
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-400 mb-2">Wallet Address</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-900/50 rounded-lg px-4 py-3 text-white font-mono text-xs md:text-sm break-all">
                      {settings?.usdt_wallet_address || 'Loading...'}
                    </div>
                    <button
                      onClick={() => handleCopy(settings?.usdt_wallet_address)}
                      className="p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition flex-shrink-0"
                      data-testid="copy-wallet-btn"
                    >
                      <Copy className="w-5 h-5 text-blue-400" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-blue-500/5 rounded-lg p-3">
                  📱 Scan QR code or copy address to send USDT. Then submit transaction details below.
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6 opacity-50 bg-gradient-to-br from-gray-500/10 to-gray-600/10" data-testid="bank-payment-method">
              <h3 className="text-lg font-bold text-white mb-4">Bank Transfer</h3>
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🏦</div>
                <div className="text-yellow-400 font-bold text-lg mb-2">Coming Soon</div>
                <div className="text-xs text-gray-500">Bank transfer option will be available soon</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (USD) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                placeholder="Enter amount"
                required
                data-testid="amount-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Hash *</label>
              <input
                type="text"
                value={formData.transaction_hash}
                onChange={(e) => setFormData({ ...formData, transaction_hash: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white font-mono text-sm"
                placeholder="Enter transaction hash"
                required
                data-testid="transaction-hash-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Screenshot</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 md:p-8 text-center hover:border-blue-500 transition bg-gradient-to-br from-blue-500/5 to-transparent">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, screenshot: e.target.files[0] })}
                  className="hidden"
                  id="screenshot-upload"
                  data-testid="screenshot-input"
                />
                <label htmlFor="screenshot-upload" className="cursor-pointer block">
                  <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-gray-500" />
                  <div className="text-white mb-2 font-medium">
                    {formData.screenshot ? formData.screenshot.name : 'Click to upload screenshot'}
                  </div>
                  <div className="text-sm text-gray-500">PNG, JPG up to 10MB</div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg py-4"
              data-testid="submit-deposit-btn"
            >
              {loading ? 'Submitting...' : 'Submit Deposit'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="glass rounded-2xl p-6 md:p-8 bg-gradient-to-br from-gray-500/5 to-transparent" data-testid="deposit-history">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Deposit History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-3 md:px-4 text-gray-400 font-medium text-sm">Date</th>
                <th className="text-left py-4 px-3 md:px-4 text-gray-400 font-medium text-sm">Amount</th>
                <th className="text-left py-4 px-3 md:px-4 text-gray-400 font-medium text-sm hidden md:table-cell">TX Hash</th>
                <th className="text-left py-4 px-3 md:px-4 text-gray-400 font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500">
                    No deposits yet
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.deposit_id} className="border-b border-white/5 hover:bg-white/5 transition" data-testid={`deposit-row-${deposit.deposit_id}`}>
                    <td className="py-4 px-3 md:px-4 text-gray-300 text-xs md:text-sm">{formatDateTime(deposit.created_at)}</td>
                    <td className="py-4 px-3 md:px-4 text-white font-mono font-bold text-sm md:text-base">{formatCurrency(deposit.amount)}</td>
                    <td className="py-4 px-3 md:px-4 text-gray-400 font-mono text-xs hidden md:table-cell">
                      {deposit.transaction_hash ? deposit.transaction_hash.substring(0, 16) + '...' : 'N/A'}
                    </td>
                    <td className="py-4 px-3 md:px-4">
                      <div className={`flex items-center gap-2 ${getStatusColor(deposit.status)}`}>
                        {getStatusIcon(deposit.status)}
                        <span className="capitalize font-medium text-xs md:text-sm">{deposit.status}</span>
                      </div>
                      {deposit.rejection_reason && (
                        <div className="text-xs text-red-400 mt-1">{deposit.rejection_reason}</div>
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

export default DepositPage;
