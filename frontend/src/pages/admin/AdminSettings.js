import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '@/api';
import { toast } from 'sonner';
import { Save, Settings as SettingsIcon, Upload, Image, X, Calendar, Calculator, Clock, Play, Mail, DollarSign, Percent } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    usdt_wallet_address: '',
    usdt_trc20_address: '',
    usdt_bep20_address: '',
    qr_code_image: null,
    qr_code_trc20: null,
    qr_code_bep20: null,
    withdrawal_dates: [1, 15],
    community_star_target: 28.0,
    community_star_bonus_min: 100.0,
    community_star_bonus_max: 1000.0,
    roi_distribution_hour: 0,
    roi_distribution_minute: 0,
    deposit_charge_type: 'percentage',
    deposit_charge_value: 0,
    withdrawal_charge_type: 'percentage',
    withdrawal_charge_value: 0
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [roiLoading, setRoiLoading] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [activeQrUpload, setActiveQrUpload] = useState(null); // 'trc20' or 'bep20'
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSettings();
    loadSchedulerStatus();
    loadEmailLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      if (response.data) {
        setSettings({
          ...response.data,
          withdrawal_dates: response.data.withdrawal_dates || [1, 15],
          roi_distribution_hour: response.data.roi_distribution_hour || 0,
          roi_distribution_minute: response.data.roi_distribution_minute || 0,
          deposit_charge_type: response.data.deposit_charge_type || 'percentage',
          deposit_charge_value: response.data.deposit_charge_value || 0,
          withdrawal_charge_type: response.data.withdrawal_charge_type || 'percentage',
          withdrawal_charge_value: response.data.withdrawal_charge_value || 0,
          usdt_trc20_address: response.data.usdt_trc20_address || response.data.usdt_wallet_address || '',
          usdt_bep20_address: response.data.usdt_bep20_address || '',
          qr_code_trc20: response.data.qr_code_trc20 || response.data.qr_code_image || null,
          qr_code_bep20: response.data.qr_code_bep20 || null
        });
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const loadSchedulerStatus = async () => {
    try {
      const response = await adminAPI.getROISchedulerStatus();
      setSchedulerStatus(response.data);
    } catch (error) {
      console.error('Failed to load scheduler status', error);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await adminAPI.getEmailLogs();
      setEmailLogs(response.data.slice(0, 10));
    } catch (error) {
      console.error('Failed to load email logs', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminAPI.updateSettings({
        ...settings,
        settings_id: 'default'
      });
      toast.success('Settings updated successfully!');
      loadSettings();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        if (activeQrUpload === 'trc20') {
          setSettings({ ...settings, qr_code_trc20: base64 });
        } else if (activeQrUpload === 'bep20') {
          setSettings({ ...settings, qr_code_bep20: base64 });
        }
        toast.success('QR code uploaded successfully!');
        setUploading(false);
        setActiveQrUpload(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload QR code');
      setUploading(false);
    }
  };

  const handleCalculateROI = async () => {
    setRoiLoading(true);
    try {
      const response = await adminAPI.calculateROI();
      toast.success(response.data.message);
      loadSchedulerStatus();
    } catch (error) {
      toast.error('Failed to calculate ROI');
    } finally {
      setRoiLoading(false);
    }
  };

  const handleSetROISchedule = async () => {
    try {
      const response = await adminAPI.setROIScheduleTime(settings.roi_distribution_hour, settings.roi_distribution_minute);
      toast.success(response.data.message);
      loadSchedulerStatus();
    } catch (error) {
      toast.error('Failed to set ROI schedule');
    }
  };

  const toggleWithdrawalDate = (day) => {
    const dates = settings.withdrawal_dates || [];
    if (dates.includes(day)) {
      setSettings({ ...settings, withdrawal_dates: dates.filter(d => d !== day) });
    } else {
      setSettings({ ...settings, withdrawal_dates: [...dates, day].sort((a, b) => a - b) });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8" data-testid="admin-settings">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Platform Settings</h1>
        <p className="text-gray-400 text-sm">Configure platform parameters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Settings */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Payment Settings - USDT Networks
          </h2>
          
          <div className="space-y-6">
            {/* TRC20 Network */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-md font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                TRC-20 Network (Tron)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">USDT TRC-20 Wallet Address *</label>
                  <input
                    type="text"
                    value={settings.usdt_trc20_address}
                    onChange={(e) => setSettings({ ...settings, usdt_trc20_address: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    placeholder="Enter TRC-20 wallet address (starts with T)"
                    data-testid="usdt-trc20-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">TRC-20 QR Code</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div 
                      onClick={() => { setActiveQrUpload('trc20'); fileInputRef.current?.click(); }}
                      className="flex-shrink-0 w-28 h-28 bg-gray-900/50 border border-dashed border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors overflow-hidden"
                    >
                      {settings.qr_code_trc20 ? (
                        <img src={settings.qr_code_trc20} alt="TRC-20 QR" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center">
                          <Image className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Upload</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => { setActiveQrUpload('trc20'); fileInputRef.current?.click(); }}
                        disabled={uploading}
                        className="btn-secondary flex items-center gap-2 mb-2 text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading && activeQrUpload === 'trc20' ? 'Uploading...' : 'Upload TRC-20 QR'}
                      </button>
                      {settings.qr_code_trc20 && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, qr_code_trc20: null })}
                          className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BEP20 Network */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-md font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                BEP-20 Network (BSC)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">USDT BEP-20 Wallet Address *</label>
                  <input
                    type="text"
                    value={settings.usdt_bep20_address}
                    onChange={(e) => setSettings({ ...settings, usdt_bep20_address: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    placeholder="Enter BEP-20 wallet address (starts with 0x)"
                    data-testid="usdt-bep20-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">BEP-20 QR Code</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div 
                      onClick={() => { setActiveQrUpload('bep20'); fileInputRef.current?.click(); }}
                      className="flex-shrink-0 w-28 h-28 bg-gray-900/50 border border-dashed border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-yellow-500/50 transition-colors overflow-hidden"
                    >
                      {settings.qr_code_bep20 ? (
                        <img src={settings.qr_code_bep20} alt="BEP-20 QR" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center">
                          <Image className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Upload</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => { setActiveQrUpload('bep20'); fileInputRef.current?.click(); }}
                        disabled={uploading}
                        className="btn-secondary flex items-center gap-2 mb-2 text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading && activeQrUpload === 'bep20' ? 'Uploading...' : 'Upload BEP-20 QR'}
                      </button>
                      {settings.qr_code_bep20 && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, qr_code_bep20: null })}
                          className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleQRUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500">Users will select their preferred network when making deposits</p>
          </div>
        </div>
          </div>
        </div>

        {/* Deposit & Withdrawal Charges */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Transaction Charges
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Deposit Charges */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
              <h3 className="text-md font-semibold text-green-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Deposit Charges
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Charge Type</label>
                  <select
                    value={settings.deposit_charge_type}
                    onChange={(e) => setSettings({ ...settings, deposit_charge_type: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                    data-testid="deposit-charge-type"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Charge Value {settings.deposit_charge_type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.deposit_charge_value}
                      onChange={(e) => setSettings({ ...settings, deposit_charge_value: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white pr-10"
                      placeholder="0"
                      data-testid="deposit-charge-value"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {settings.deposit_charge_type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {settings.deposit_charge_type === 'percentage' 
                    ? `${settings.deposit_charge_value}% will be deducted from deposits`
                    : `$${settings.deposit_charge_value} will be deducted from each deposit`
                  }
                </p>
              </div>
            </div>

            {/* Withdrawal Charges */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-md font-semibold text-red-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                Withdrawal Charges
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Charge Type</label>
                  <select
                    value={settings.withdrawal_charge_type}
                    onChange={(e) => setSettings({ ...settings, withdrawal_charge_type: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                    data-testid="withdrawal-charge-type"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Charge Value {settings.withdrawal_charge_type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.withdrawal_charge_value}
                      onChange={(e) => setSettings({ ...settings, withdrawal_charge_value: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white pr-10"
                      placeholder="0"
                      data-testid="withdrawal-charge-value"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {settings.withdrawal_charge_type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {settings.withdrawal_charge_type === 'percentage' 
                    ? `${settings.withdrawal_charge_value}% will be deducted from withdrawals`
                    : `$${settings.withdrawal_charge_value} will be deducted from each withdrawal`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Settings */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Withdrawal Settings
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Allowed Withdrawal Dates</label>
            <p className="text-xs text-gray-500 mb-4">Select the days of the month when users can withdraw</p>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWithdrawalDate(day)}
                  className={`p-2 text-sm rounded-lg transition-colors ${
                    (settings.withdrawal_dates || []).includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Selected: {(settings.withdrawal_dates || []).length > 0 
                ? settings.withdrawal_dates.join(', ') 
                : 'All days (no restriction)'}
            </p>
          </div>
        </div>

        {/* ROI Distribution Settings */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Automatic ROI Distribution
          </h2>
          
          {/* Scheduler Status */}
          {schedulerStatus && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${schedulerStatus.is_running ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-green-400 font-bold text-sm">
                  Auto ROI: {schedulerStatus.is_running ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <span className="text-gray-500">Schedule:</span> {schedulerStatus.schedule}
                </div>
                <div>
                  <span className="text-gray-500">Next Run:</span> {schedulerStatus.next_run ? new Date(schedulerStatus.next_run).toLocaleString() : 'Not scheduled'}
                </div>
                {schedulerStatus.last_run && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Last Run:</span> {new Date(schedulerStatus.last_run).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hour (UTC)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.roi_distribution_hour}
                onChange={(e) => setSettings({ ...settings, roi_distribution_hour: parseInt(e.target.value) || 0 })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minute</label>
              <input
                type="number"
                min="0"
                max="59"
                value={settings.roi_distribution_minute}
                onChange={(e) => setSettings({ ...settings, roi_distribution_minute: parseInt(e.target.value) || 0 })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSetROISchedule}
              className="btn-secondary flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Update Schedule
            </button>
            <button
              type="button"
              onClick={handleCalculateROI}
              disabled={roiLoading}
              className="btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {roiLoading ? 'Processing...' : 'Run Now (Manual)'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            ROI is automatically distributed daily at the scheduled time. Use "Run Now" for manual distribution.
          </p>
        </div>

        {/* Email Logs */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Email Activity
          </h2>
          {emailLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No email logs yet</p>
          ) : (
            <div className="space-y-2">
              {emailLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm">
                  <div>
                    <span className="text-white font-medium">{log.email_type}</span>
                    <span className="text-gray-500 ml-2">→ {log.to_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {log.status}
                    </span>
                    <span className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Star Program */}
        <div className="glass rounded-xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-5">Community Star Program</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Growth Target (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.community_star_target}
                onChange={(e) => setSettings({ ...settings, community_star_target: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Bonus (USDT)</label>
              <input
                type="number"
                step="0.01"
                value={settings.community_star_bonus_min}
                onChange={(e) => setSettings({ ...settings, community_star_bonus_min: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Bonus (USDT)</label>
              <input
                type="number"
                step="0.01"
                value={settings.community_star_bonus_max}
                onChange={(e) => setSettings({ ...settings, community_star_bonus_max: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto btn-primary flex items-center justify-center gap-2 px-12"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
