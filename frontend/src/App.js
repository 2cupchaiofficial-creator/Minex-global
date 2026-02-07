import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/AuthContext';
import { Toaster } from 'sonner';
import './App.css';

// Eager load critical pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// Lazy load other pages for better performance
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const UserLayout = lazy(() => import('@/layouts/UserLayout'));
const UserDashboard = lazy(() => import('@/pages/user/UserDashboard'));
const DepositPage = lazy(() => import('@/pages/user/DepositPage'));
const WithdrawPage = lazy(() => import('@/pages/user/WithdrawPage'));
const StakingPage = lazy(() => import('@/pages/user/StakingPage'));
const TeamPage = lazy(() => import('@/pages/user/TeamPage'));
const CommissionsPage = lazy(() => import('@/pages/user/CommissionsPage'));
const ProfilePage = lazy(() => import('@/pages/user/ProfilePage'));
const TransactionsPage = lazy(() => import('@/pages/user/TransactionsPage'));

const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminDeposits = lazy(() => import('@/pages/admin/AdminDeposits'));
const AdminWithdrawals = lazy(() => import('@/pages/admin/AdminWithdrawals'));
const AdminPackages = lazy(() => import('@/pages/admin/AdminPackages'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminPromotions = lazy(() => import('@/pages/admin/AdminPromotions'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-[#02040A] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

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
            <Route path="/admin/promotions" element={
              <PrivateRoute adminOnly>
                <AdminLayout><AdminPromotions /></AdminLayout>
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
