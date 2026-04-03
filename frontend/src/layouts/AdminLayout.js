import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Settings,
  LogOut, 
  Menu, 
  X,
  Shield,
  Package,
  Gift,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/deposits', icon: ArrowDownToLine, label: 'Deposits' },
    { path: '/admin/withdrawals', icon: ArrowUpFromLine, label: 'Withdrawals' },
    { path: '/admin/packages', icon: Package, label: 'Investment Packages' },
    { path: '/admin/promotions', icon: Gift, label: 'Promotions' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A]' : 'bg-slate-100'}`} data-testid="admin-layout">
      {/* Top Bar */}
      <div className={`fixed top-0 w-full h-16 ${darkMode ? 'bg-[#0A0A0A]/80' : 'bg-white/80'} backdrop-blur-xl border-b ${darkMode ? 'border-[#D4AF37]/10' : 'border-slate-200'} z-50`} data-testid="admin-topbar">
        <div className="flex items-center justify-between h-full px-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 ${darkMode ? 'hover:bg-[#D4AF37]/10' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
              data-testid="mobile-menu-btn"
            >
              {sidebarOpen ? <X className={`w-6 h-6 ${darkMode ? 'text-[#E0E0E0]' : 'text-slate-900'}`} /> : <Menu className={`w-6 h-6 ${darkMode ? 'text-[#E0E0E0]' : 'text-slate-900'}`} />}
            </button>
            <Link to="/admin">
              <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-8" />
            </Link>
            {/* Admin Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Dark/Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl transition-colors ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
              data-testid="theme-toggle"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className={`text-sm font-semibold ${darkMode ? 'text-[#E0E0E0]' : 'text-slate-900'}`} data-testid="admin-username">{user?.full_name}</div>
                <div className="text-[10px] text-red-400 font-medium uppercase tracking-wider">Administrator</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-[#E0E0E0] font-bold text-sm">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className={`p-2.5 rounded-xl transition-colors group ${darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                data-testid="logout-btn"
              >
                <LogOut className={`w-5 h-5 ${darkMode ? 'text-[#A0A0A0]' : 'text-[#A0A0A0]'} group-hover:text-red-400 transition-colors`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 ${darkMode ? 'bg-[#0A0A0A]' : 'bg-white'} border-r ${darkMode ? 'border-[#D4AF37]/10' : 'border-slate-200'} z-40 transition-transform duration-300 flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          data-testid="admin-sidebar"
        >
          {/* Admin Info Card - Mobile */}
          <div className="lg:hidden p-4 border-b border-[#D4AF37]/10">
            <div className={`flex items-center gap-3 p-3 ${darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'} border rounded-xl`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-[#E0E0E0] font-bold text-sm">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${darkMode ? 'text-[#E0E0E0]' : 'text-slate-900'}`}>{user?.full_name}</div>
                <div className="text-xs text-red-400">Administrator</div>
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
                      ? darkMode 
                        ? 'bg-red-500/10 border border-red-500/20 text-[#E0E0E0] shadow-[inset_4px_0_0_#EF4444]'
                        : 'bg-red-50 border border-red-100 text-red-600 shadow-[inset_4px_0_0_#EF4444]'
                      : darkMode
                        ? 'text-[#A0A0A0] hover:bg-[#D4AF37]/10 hover:text-[#E0E0E0]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : darkMode ? 'group-hover:text-red-400' : 'group-hover:text-red-500'} transition-colors`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-red-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className={`p-4 border-t ${darkMode ? 'border-[#D4AF37]/10' : 'border-slate-200'}`}>
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-[#D4AF37]/20' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-[#A0A0A0]' : 'text-[#A0A0A0]'}`}>Admin Tools</div>
              <div className={`text-sm font-medium ${darkMode ? 'text-[#E0E0E0]' : 'text-slate-900'}`}>System Settings</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 p-4 lg:p-8 min-h-[calc(100vh-4rem)] ${darkMode ? '' : 'bg-slate-50'}`} data-testid="admin-main-content">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            data-testid="sidebar-overlay"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout;
