import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api';
import { formatCurrency, formatDate } from '@/utils';
import { toast } from 'sonner';
import { Search, User, Mail, TrendingUp, Wallet, Users, Calendar } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="users-title">Manage Users</h1>
        <p className="text-gray-400 text-sm md:text-base">View and manage all platform users</p>
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
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Investment</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Balance</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Team</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
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
                    <td className="py-4 px-4 text-white font-mono font-bold">{formatCurrency(user.total_investment)}</td>
                    <td className="py-4 px-4 text-green-400 font-mono font-bold">{formatCurrency(user.wallet_balance)}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {user.direct_referrals?.length || 0}D / {user.indirect_referrals?.length || 0}I
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{formatDate(user.created_at)}</td>
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
                      Investment
                    </div>
                    <div className="text-white font-mono font-bold text-sm">
                      {formatCurrency(user.total_investment)}
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
