import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '@/api';
import { formatCurrency, formatDate } from '@/utils';
import { toast } from 'sonner';
import { Search, User, Mail, TrendingUp, Wallet, Users, Calendar, LogIn, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/AuthContext';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [impersonating, setImpersonating] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (user) => {
    if (user.role?.toLowerCase() === 'admin') {
      toast.error('Cannot login as admin users');
      return;
    }

    if (!window.confirm(`Login as "${user.full_name}" (${user.email})? You will be redirected to their dashboard.`)) {
      return;
    }

    setImpersonating(user.user_id);
    try {
      const response = await adminAPI.impersonateUser(user.user_id);
      
      // Store the new token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Update auth context
      login(response.data.token, response.data.user);
      
      toast.success(`Logged in as ${user.full_name}`);
      
      // Redirect to user dashboard
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to login as user');
    } finally {
      setImpersonating(null);
    }
  };

  const handleRecalculateLevels = async () => {
    if (!window.confirm('This will recalculate ALL user levels based on their active staking amount. Continue?')) {
      return;
    }

    setRecalculating(true);
    try {
      const response = await adminAPI.recalculateAllLevels();
      const { total_users_checked, levels_changed, changes } = response.data;
      
      if (levels_changed > 0) {
        toast.success(`Levels recalculated! ${levels_changed} users updated out of ${total_users_checked}.`);
        // Show details of changes
        changes.forEach(change => {
          toast.info(`${change.email}: Level ${change.old_level} → ${change.new_level}`);
        });
        // Reload users to show updated levels
        loadUsers();
      } else {
        toast.success(`All ${total_users_checked} users have correct levels. No changes needed.`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to recalculate levels');
    } finally {
      setRecalculating(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8" data-testid="admin-users">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="users-title">Manage Users</h1>
          <p className="text-gray-400 text-sm md:text-base">View and manage all platform users</p>
        </div>
        <button
          onClick={handleRecalculateLevels}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg transition min-h-[44px] disabled:opacity-50 w-full sm:w-auto justify-center"
          data-testid="recalculate-levels-btn"
        >
          {recalculating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Recalculating...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Fix User Levels</span>
            </>
          )}
        </button>
      </div>

      <div className="glass rounded-xl md:rounded-2xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-12 pr-4 py-3 text-white text-base"
              placeholder="Search by email, name, or user ID"
              data-testid="search-input"
            />
          </div>
          <div className="text-gray-400 text-sm sm:text-base text-center sm:text-left shrink-0">
            {filteredUsers.length} users
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Level</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Wallet Balance</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">ROI Balance</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Team</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Joined</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-white/5 hover:bg-white/5" data-testid={`user-row-${user.user_id}`}>
                    <td className="py-4 px-4 text-white">{user.full_name}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
                        Level {user.level}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white font-mono font-bold">{formatCurrency(user.wallet_balance || 0)}</td>
                    <td className="py-4 px-4 text-green-400 font-mono font-bold">{formatCurrency(user.roi_balance || 0)}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {user.direct_referrals?.length || 0}D / {user.indirect_referrals?.length || 0}I
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{formatDate(user.created_at)}</td>
                    <td className="py-4 px-4">
                      {user.role?.toLowerCase() !== 'admin' && (
                        <button
                          onClick={() => handleImpersonate(user)}
                          disabled={impersonating === user.user_id}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition min-h-[44px] disabled:opacity-50"
                          data-testid={`login-as-${user.user_id}`}
                          title="Login as this user"
                        >
                          {impersonating === user.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogIn className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">Login</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div 
                key={user.user_id} 
                className="bg-white/5 rounded-xl p-4 space-y-3"
                data-testid={`user-card-${user.user_id}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{user.full_name}</h3>
                      <p className="text-gray-400 text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-bold">
                    Lvl {user.level}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Active Staking
                    </div>
                    <div className="text-white font-mono font-bold text-sm">
                      {formatCurrency(user.staked_amount || 0)}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Wallet className="w-3 h-3" />
                      Balance
                    </div>
                    <div className="text-green-400 font-mono font-bold text-sm">
                      {formatCurrency(user.wallet_balance)}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Users className="w-3 h-3" />
                    Team: {user.direct_referrals?.length || 0}D / {user.indirect_referrals?.length || 0}I
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="w-3 h-3" />
                    {formatDate(user.created_at)}
                  </div>
                </div>

                {/* Login as User Button */}
                {user.role?.toLowerCase() !== 'admin' && (
                  <button
                    onClick={() => handleImpersonate(user)}
                    disabled={impersonating === user.user_id}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition min-h-[48px] disabled:opacity-50"
                    data-testid={`login-as-mobile-${user.user_id}`}
                  >
                    {impersonating === user.user_id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Logging in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span className="text-sm font-medium">Login as User</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
