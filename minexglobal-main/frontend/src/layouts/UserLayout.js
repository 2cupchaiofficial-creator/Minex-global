import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Zap, 
  Users, 
  Gift, 
  User, 
  LogOut, 
  Menu, 
  X,
  History
} from 'lucide-react';

const UserLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/deposit', icon: ArrowDownToLine, label: 'Deposit' },
    { path: '/withdraw', icon: ArrowUpFromLine, label: 'Withdraw' },
    { path: '/staking', icon: Zap, label: 'Invest' },
    { path: '/transactions', icon: History, label: 'Transactions' },
    { path: '/team', icon: Users, label: 'My Team' },
    { path: '/commissions', icon: Gift, label: 'Commissions' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#02040A]" data-testid="user-layout">
      <div className="fixed top-0 w-full h-16 glass border-b border-white/5 z-50" data-testid="topbar">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
              data-testid="mobile-menu-btn"
            >
              {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
            <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-8" />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 glass rounded-lg px-4 py-2">
              <Wallet className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">Balance</div>
                <div className="text-sm text-white font-mono font-bold" data-testid="header-balance">
                  ${user?.wallet_balance?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <div className="text-sm text-white font-bold" data-testid="header-username">{user?.full_name}</div>
                <div className="text-xs text-gray-400">Level {user?.level}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/5 rounded-lg transition"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        <aside
          className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 glass border-r border-white/5 z-40 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          data-testid="sidebar"
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8" data-testid="main-content">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}
    </div>
  );
};

export default UserLayout;
