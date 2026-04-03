import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  History,
  Bell,
  ChevronRight
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
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="user-layout">
      {/* Top Bar */}
      <div className="fixed top-0 w-full h-16 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#D4AF37]/10 z-50" data-testid="topbar">
        <div className="flex items-center justify-between h-full px-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-[#D4AF37]/10 rounded-lg transition-colors"
              data-testid="mobile-menu-btn"
            >
              {sidebarOpen ? <X className="w-6 h-6 text-[#E0E0E0]" /> : <Menu className="w-6 h-6 text-[#E0E0E0]" />}
            </button>
            <Link to="/dashboard">
              <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-8" />
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Fund Wallet - Desktop */}
            <div className="hidden md:flex items-center gap-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl px-4 py-2">
              <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
                <Wallet className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <div className="text-[10px] text-[#A0A0A0] uppercase tracking-wider">Fund Wallet</div>
                <div className="text-sm text-[#E0E0E0] font-semibold font-mono" data-testid="header-balance">
                  ${user?.fund_balance?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2.5 hover:bg-[#D4AF37]/10 rounded-xl transition-colors" data-testid="notification-btn">
              <Bell className="w-5 h-5 text-[#A0A0A0]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full"></span>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm text-[#E0E0E0] font-semibold" data-testid="header-username">{user?.full_name}</div>
                <div className="text-[10px] text-[#D4AF37] font-medium uppercase tracking-wider">Level {user?.level}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center text-[#0A0A0A] font-bold text-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 hover:bg-red-500/10 rounded-xl transition-colors group"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5 text-[#A0A0A0] group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#0A0A0A] border-r border-[#D4AF37]/10 z-40 transition-transform duration-300 flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          data-testid="sidebar"
        >
          {/* User Card - Mobile */}
          <div className="lg:hidden p-4 border-b border-[#D4AF37]/10">
            <div className="flex items-center gap-3 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center text-[#0A0A0A] font-bold text-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#E0E0E0] font-semibold truncate">{user?.full_name}</div>
                <div className="text-xs text-[#A0A0A0]">Fund: ${user?.fund_balance?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#E0E0E0] shadow-[inset_4px_0_0_#D4AF37]'
                      : 'text-[#A0A0A0] hover:bg-[#D4AF37]/5 hover:text-[#E0E0E0]'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4AF37]' : 'group-hover:text-[#D4AF37]'} transition-colors`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#D4AF37]" />}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#D4AF37]/10">
            <div className="p-4 bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20">
              <div className="text-xs text-[#A0A0A0] mb-1">Need Help?</div>
              <div className="text-sm text-[#E0E0E0] font-medium">Contact Support</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-4rem)]" data-testid="main-content">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            data-testid="sidebar-overlay"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserLayout;
