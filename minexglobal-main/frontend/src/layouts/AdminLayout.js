import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
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
  Package
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/deposits', icon: ArrowDownToLine, label: 'Deposits' },
    { path: '/admin/withdrawals', icon: ArrowUpFromLine, label: 'Withdrawals' },
    { path: '/admin/packages', icon: Package, label: 'Investment Packages' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#02040A]" data-testid="admin-layout">
      <div className="fixed top-0 w-full h-16 glass border-b border-white/5 z-50" data-testid="admin-topbar">
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
            <div className="hidden sm:flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-bold">ADMIN</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm text-white font-bold" data-testid="admin-username">{user?.full_name}</div>
              <div className="text-xs text-gray-400">Administrator</div>
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

      <div className="flex pt-16">
        <aside
          className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 glass border-r border-white/5 z-40 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          data-testid="admin-sidebar"
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
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  data-testid={`admin-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8" data-testid="admin-main-content">
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

export default AdminLayout;
