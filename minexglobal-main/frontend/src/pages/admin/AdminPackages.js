import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api';
import { formatCurrency } from '@/utils';
import { toast } from 'sonner';
import { Plus, Edit, Save, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    min_investment: '',
    max_investment: '',
    daily_roi: '',
    annual_roi: '',
    duration_days: 365,
    direct_required: 0,
    level_2_required: 0,
    level_3_required: 0,
    level_4_required: 0,
    level_5_required: 0,
    level_6_required: 0,
    commission_direct: 0,
    commission_level_2: 0,
    commission_level_3: 0,
    commission_level_4: 0,
    commission_level_5: 0,
    commission_level_6: 0,
    levels_enabled: [1, 2, 3],
    is_active: true
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      // Use admin endpoint to get ALL packages (including inactive)
      const response = await adminAPI.getInvestmentPackages();
      setPackages(response.data);
    } catch (error) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (packageId, currentStatus) => {
    try {
      await adminAPI.togglePackageStatus(packageId);
      toast.success(currentStatus ? 'Package deactivated' : 'Package activated');
      loadPackages();
    } catch (error) {
      toast.error('Failed to toggle package status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const packageData = {
        ...formData,
        package_id: editingPackage?.package_id || `pkg_${Date.now()}`,
        level: parseInt(formData.level),
        min_investment: parseFloat(formData.min_investment),
        max_investment: parseFloat(formData.max_investment),
        daily_roi: parseFloat(formData.daily_roi),
        annual_roi: parseFloat(formData.daily_roi) * 365,
        duration_days: parseInt(formData.duration_days),
        direct_required: parseInt(formData.direct_required),
        level_2_required: parseInt(formData.level_2_required),
        level_3_required: parseInt(formData.level_3_required),
        level_4_required: parseInt(formData.level_4_required),
        level_5_required: parseInt(formData.level_5_required),
        level_6_required: parseInt(formData.level_6_required),
        commission_direct: parseFloat(formData.commission_direct),
        commission_level_2: parseFloat(formData.commission_level_2),
        commission_level_3: parseFloat(formData.commission_level_3),
        commission_level_4: parseFloat(formData.commission_level_4),
        commission_level_5: parseFloat(formData.commission_level_5),
        commission_level_6: parseFloat(formData.commission_level_6),
        created_at: new Date().toISOString()
      };

      if (editingPackage) {
        await adminAPI.updateInvestmentPackage(editingPackage.package_id, packageData);
        toast.success('Package updated successfully!');
      } else {
        await adminAPI.createInvestmentPackage(packageData);
        toast.success('Package created successfully!');
      }

      setShowDialog(false);
      setEditingPackage(null);
      resetForm();
      loadPackages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      level: '',
      min_investment: '',
      max_investment: '',
      daily_roi: '',
      annual_roi: '',
      duration_days: 365,
      direct_required: 0,
      level_2_required: 0,
      level_3_required: 0,
      level_4_required: 0,
      level_5_required: 0,
      level_6_required: 0,
      commission_direct: 0,
      commission_level_2: 0,
      commission_level_3: 0,
      commission_level_4: 0,
      commission_level_5: 0,
      commission_level_6: 0,
      levels_enabled: [1, 2, 3],
      is_active: true
    });
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      level: pkg.level,
      min_investment: pkg.min_investment,
      max_investment: pkg.max_investment || pkg.min_investment * 10,
      daily_roi: pkg.daily_roi,
      annual_roi: pkg.annual_roi,
      duration_days: pkg.duration_days || 365,
      direct_required: pkg.direct_required || 0,
      level_2_required: pkg.level_2_required || 0,
      level_3_required: pkg.level_3_required || 0,
      level_4_required: pkg.level_4_required || 0,
      level_5_required: pkg.level_5_required || 0,
      level_6_required: pkg.level_6_required || 0,
      commission_direct: pkg.commission_direct || pkg.commission_lv_a || 0,
      commission_level_2: pkg.commission_level_2 || pkg.commission_lv_b || 0,
      commission_level_3: pkg.commission_level_3 || pkg.commission_lv_c || 0,
      commission_level_4: pkg.commission_level_4 || 0,
      commission_level_5: pkg.commission_level_5 || 0,
      commission_level_6: pkg.commission_level_6 || 0,
      levels_enabled: pkg.levels_enabled || [1, 2, 3],
      is_active: pkg.is_active
    });
    setShowDialog(true);
  };

  const toggleLevelEnabled = (level) => {
    const levels = formData.levels_enabled || [];
    if (levels.includes(level)) {
      setFormData({ ...formData, levels_enabled: levels.filter(l => l !== level) });
    } else {
      setFormData({ ...formData, levels_enabled: [...levels, level].sort() });
    }
  };

  const calculateAnnualROI = (dailyROI) => {
    return (parseFloat(dailyROI) * 365).toFixed(1);
  };

  return (
    <div className="space-y-6 md:space-y-8" data-testid="admin-packages">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Investment Packages</h1>
          <p className="text-gray-400 text-sm">Create and manage investment packages</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPackage(null);
            setShowDialog(true);
          }}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          data-testid="create-package-btn"
        >
          <Plus className="w-5 h-5" />
          Create Package
        </button>
      </div>

      {/* Empty State */}
      {packages.length === 0 && !loading && (
        <div className="glass rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Packages Yet</h3>
          <p className="text-gray-400 mb-6">Create your first investment package to get started</p>
          <button
            onClick={() => {
              resetForm();
              setEditingPackage(null);
              setShowDialog(true);
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create First Package
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {packages.map((pkg) => (
          <div
            key={pkg.package_id}
            className={`glass rounded-xl p-5 transition-all group relative ${!pkg.is_active ? 'opacity-60 border-red-500/30' : 'hover:border-blue-500/50'}`}
            data-testid={`package-card-${pkg.level}`}
          >
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${pkg.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {pkg.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {/* Actions */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => handleToggleStatus(pkg.package_id, pkg.is_active)}
                className={`p-2 rounded-lg transition ${pkg.is_active ? 'bg-green-500/10 hover:bg-green-500/20' : 'bg-red-500/10 hover:bg-red-500/20'}`}
                title={pkg.is_active ? 'Deactivate Package' : 'Activate Package'}
                data-testid={`toggle-package-${pkg.level}`}
              >
                {pkg.is_active ? (
                  <ToggleRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-red-400" />
                )}
              </button>
              <button
                onClick={() => handleEdit(pkg)}
                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition"
                data-testid={`edit-package-${pkg.level}`}
              >
                <Edit className="w-4 h-4 text-blue-400" />
              </button>
            </div>
            
            <div className="mb-4 mt-6">
              <div className="inline-block px-3 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-bold rounded-full mb-2">
                Level {pkg.level}
              </div>
              <h3 className="text-lg font-bold text-white">{pkg.name || `Level ${pkg.level} Package`}</h3>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Investment Range</span>
                <span className="text-white font-bold">
                  {formatCurrency(pkg.min_investment)} - {formatCurrency(pkg.max_investment || pkg.min_investment * 10)}
                </span>
              </div>
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
                <span className="text-white font-bold">{pkg.duration_days} days</span>
              </div>
            </div>

            {(pkg.direct_required > 0 || pkg.level_2_required > 0) && (
              <div className="border-t border-white/10 pt-3 mb-3">
                <p className="text-xs text-gray-500 mb-2">Requirements</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
                    {pkg.direct_required} Direct
                  </span>
                  {pkg.level_2_required > 0 && (
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
                      {pkg.level_2_required} Lv.2
                    </span>
                  )}
                </div>
              </div>
            )}

            {pkg.level >= 2 && (
              <div className="border-t border-white/10 pt-3">
                <p className="text-xs text-gray-500 mb-2">Direct Comm. / Profit Share</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-400">{pkg.commission_direct || pkg.commission_lv_a || 0}%</div>
                    <div className="text-xs text-gray-500">Direct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-purple-400">{pkg.commission_level_2 || pkg.commission_lv_b || 0}%</div>
                    <div className="text-xs text-gray-500">PS Lv.2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-violet-400">{pkg.commission_level_3 || pkg.commission_lv_c || 0}%</div>
                    <div className="text-xs text-gray-500">PS Lv.3</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-950 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {editingPackage ? 'Edit Package' : 'Create Investment Package'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Package Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white"
                  placeholder="e.g., Gold NFT, Diamond Package"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level *</label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Days) *</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                  min="1"
                />
              </div>
            </div>

            {/* Investment Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Investment ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_investment}
                  onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Investment ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.max_investment}
                  onChange={(e) => setFormData({ ...formData, max_investment: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                />
              </div>
            </div>

            {/* ROI */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Daily ROI (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.daily_roi}
                  onChange={(e) => {
                    const dailyROI = e.target.value;
                    setFormData({ 
                      ...formData, 
                      daily_roi: dailyROI,
                      annual_roi: calculateAnnualROI(dailyROI)
                    });
                  }}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-4 py-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Annual ROI (%)</label>
                <input
                  type="text"
                  value={formData.annual_roi || (formData.daily_roi ? calculateAnnualROI(formData.daily_roi) : '')}
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-gray-400"
                  readOnly
                />
              </div>
            </div>

            {/* Levels Enabled */}
            <div className="border-t border-white/10 pt-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">Commission Levels Enabled</label>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(formData.levels_enabled || []).includes(level)}
                      onCheckedChange={() => toggleLevelEnabled(level)}
                      className="border-gray-600"
                    />
                    <span className="text-sm text-gray-300">Level {level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-base font-bold text-white mb-3">Promotion Requirements</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Direct Referrals</label>
                  <input
                    type="number"
                    value={formData.direct_required}
                    onChange={(e) => setFormData({ ...formData, direct_required: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Level 2 Refs</label>
                  <input
                    type="number"
                    value={formData.level_2_required}
                    onChange={(e) => setFormData({ ...formData, level_2_required: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Level 3 Refs</label>
                  <input
                    type="number"
                    value={formData.level_3_required}
                    onChange={(e) => setFormData({ ...formData, level_3_required: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Level 4 Refs</label>
                  <input
                    type="number"
                    value={formData.level_4_required}
                    onChange={(e) => setFormData({ ...formData, level_4_required: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Level 5 Refs</label>
                  <input
                    type="number"
                    value={formData.level_5_required}
                    onChange={(e) => setFormData({ ...formData, level_5_required: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Level 6 Refs</label>
                  <input
                    type="number"
                    value={formData.level_6_required}
                    onChange={(e) => setFormData({ ...formData, level_6_required: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Commission Rates - Direct Commission + Profit Share */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-base font-bold text-white mb-3">Commission & Profit Share Rates (%)</h3>
              <p className="text-xs text-gray-500 mb-3">Level 1 = Direct commission on deposits. Levels 2-6 = Profit share from daily ROI</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Direct Commission (Lv.1)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_direct}
                    onChange={(e) => setFormData({ ...formData, commission_direct: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Profit Share Lv.2</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_level_2}
                    onChange={(e) => setFormData({ ...formData, commission_level_2: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Profit Share Lv.3</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_level_3}
                    onChange={(e) => setFormData({ ...formData, commission_level_3: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Profit Share Lv.4</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_level_4}
                    onChange={(e) => setFormData({ ...formData, commission_level_4: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Profit Share Lv.5</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_level_5}
                    onChange={(e) => setFormData({ ...formData, commission_level_5: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Profit Share Lv.6</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commission_level_6}
                    onChange={(e) => setFormData({ ...formData, commission_level_6: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : (editingPackage ? 'Update Package' : 'Create Package')}
              </button>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-6 py-3 font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPackages;
