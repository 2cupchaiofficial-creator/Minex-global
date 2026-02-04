import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  sendVerification: (email) => api.post('/auth/send-verification', { email }),
  verifyEmail: (email, code) => api.post('/auth/verify-email', { email, code }),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getDashboard: () => api.get('/user/dashboard'),
  getTeam: () => api.get('/user/team'),
  getTransactions: () => api.get('/user/transactions'),
  changePassword: (data) => api.put('/user/password', data),
};

export const depositAPI = {
  create: (data) => api.post('/deposits', data),
  getAll: () => api.get('/deposits'),
  uploadScreenshot: (depositId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/deposits/${depositId}/upload-screenshot`, formData);
  },
};

export const withdrawalAPI = {
  create: (data) => api.post('/withdrawals', data),
  getAll: () => api.get('/withdrawals'),
};

export const stakingAPI = {
  getPackages: () => api.get('/staking/packages'),
  create: (data) => api.post('/staking', data),
  getUserStaking: () => api.get('/staking'),
};

export const investmentAPI = {
  getPackages: () => api.get('/investment/packages'),
  create: (data) => api.post('/staking', data),
  getUserInvestments: () => api.get('/staking'),
};

export const commissionAPI = {
  getAll: () => api.get('/commissions'),
};

export const membershipAPI = {
  getPackages: () => api.get('/membership/packages'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/admin/settings', data),
};

export const cryptoAPI = {
  getPrices: () => api.get('/crypto/prices'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getDeposits: () => api.get('/admin/deposits'),
  approveDeposit: (depositId) => api.post(`/admin/deposits/${depositId}/approve`),
  rejectDeposit: (depositId, reason) => api.post(`/admin/deposits/${depositId}/reject`, null, { params: { reason } }),
  getWithdrawals: () => api.get('/admin/withdrawals'),
  approveWithdrawal: (withdrawalId, transactionHash) => api.post(`/admin/withdrawals/${withdrawalId}/approve`, null, { params: { transaction_hash: transactionHash } }),
  rejectWithdrawal: (withdrawalId, reason) => api.post(`/admin/withdrawals/${withdrawalId}/reject`, null, { params: { reason } }),
  // Legacy membership packages
  createMembershipPackage: (data) => api.post('/admin/membership/packages', data),
  updateMembershipPackage: (packageId, data) => api.put(`/admin/membership/packages/${packageId}`, data),
  // New investment packages
  getInvestmentPackages: () => api.get('/admin/investment/packages'),
  createInvestmentPackage: (data) => api.post('/admin/investment/packages', data),
  updateInvestmentPackage: (packageId, data) => api.put(`/admin/investment/packages/${packageId}`, data),
  deleteInvestmentPackage: (packageId) => api.delete(`/admin/investment/packages/${packageId}`),
  togglePackageStatus: (packageId) => api.patch(`/admin/investment/packages/${packageId}/toggle`),
  // Legacy staking packages
  createStakingPackage: (data) => api.post('/admin/staking/packages', data),
  updateStakingPackage: (stakingId, data) => api.put(`/admin/staking/packages/${stakingId}`, data),
  // Settings
  updateSettings: (data) => api.put('/admin/settings', data),
  getSettings: () => api.get('/settings'),
  uploadQRCode: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/settings/qr-code', formData);
  },
  calculateROI: () => api.post('/admin/calculate-roi'),
  // ROI Scheduler
  getROISchedulerStatus: () => api.get('/admin/roi-scheduler/status'),
  setROIScheduleTime: (hour, minute) => api.post('/admin/roi-scheduler/set-time', null, { params: { hour, minute } }),
  // Logs
  getEmailLogs: () => api.get('/admin/email-logs'),
  getSystemLogs: () => api.get('/admin/system-logs'),
};

export default api;
