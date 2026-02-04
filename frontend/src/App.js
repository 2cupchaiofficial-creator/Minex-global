import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/AuthContext';
import { Toaster } from 'sonner';
import './App.css';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';

import UserLayout from '@/layouts/UserLayout';
import UserDashboard from '@/pages/user/UserDashboard';
import DepositPage from '@/pages/user/DepositPage';
import WithdrawPage from '@/pages/user/WithdrawPage';
import StakingPage from '@/pages/user/StakingPage';
import TeamPage from '@/pages/user/TeamPage';
import CommissionsPage from '@/pages/user/CommissionsPage';
import ProfilePage from '@/pages/user/ProfilePage';
import TransactionsPage from '@/pages/user/TransactionsPage';

import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminDeposits from '@/pages/admin/AdminDeposits';
import AdminWithdrawals from '@/pages/admin/AdminWithdrawals';
import AdminPackages from '@/pages/admin/AdminPackages';
import AdminSettings from '@/pages/admin/AdminSettings';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02040A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02040A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Toaster 
            position="top-right" 
            theme="dark"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ForgotPasswordPage />} />

            <Route path="/dashboard" element={
              <PrivateRoute>
                <UserLayout><UserDashboard /></UserLayout>
              </PrivateRoute>
            } />
            <Route path="/deposit" element={
              <PrivateRoute>
                <UserLayout><DepositPage /></UserLayout>
              </PrivateRoute>
            } />
            <Route path="/withdraw" element={
              <PrivateRoute>
                <UserLayout><WithdrawPage /></UserLayout>
              </PrivateRoute>
            } />
            <Route path="/staking" element={
              <PrivateRoute>
                <UserLayout><StakingPage /></UserLayout>
              </PrivateRoute>
            } />
            <Route path="/team" element={
              <PrivateRoute>
                <UserLayout><TeamPage /></UserLayout>
              </PrivateRoute>
            } />
            <Route path="/commissions" element={
              <PrivateRoute>
                <UserLayout><CommissionsPage /></UserLayout>
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <UserLayout><ProfilePage /></UserLayout>
              </PrivateRoute>
            } />
            <Route path="/transactions" element={
              <PrivateRoute>
                <UserLayout><TransactionsPage /></UserLayout>
              </PrivateRoute>
            } />

            <Route path="/admin" element={
              <PrivateRoute adminOnly>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </PrivateRoute>
            } />
            <Route path="/admin/users" element={
              <PrivateRoute adminOnly>
                <AdminLayout><AdminUsers /></AdminLayout>
              </PrivateRoute>
            } />
            <Route path="/admin/deposits" element={
              <PrivateRoute adminOnly>
                <AdminLayout><AdminDeposits /></AdminLayout>
              </PrivateRoute>
            } />
            <Route path="/admin/withdrawals" element={
              <PrivateRoute adminOnly>
                <AdminLayout><AdminWithdrawals /></AdminLayout>
              </PrivateRoute>
            } />
            <Route path="/admin/packages" element={
              <PrivateRoute adminOnly>
                <AdminLayout><AdminPackages /></AdminLayout>
              </PrivateRoute>
            } />
            <Route path="/admin/settings" element={
              <PrivateRoute adminOnly>
                <AdminLayout><AdminSettings /></AdminLayout>
              </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
