import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Copy, Share2 } from 'lucide-react';
import { userAPI } from '@/api';
import { formatCurrency, formatDate, copyToClipboard } from '@/utils';
import { toast } from 'sonner';
import { useAuth } from '@/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TeamPage = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState({ 
    direct: [], 
    indirect: [],
    level_1: [], level_2: [], level_3: [], level_4: [], level_5: [], level_6: []
  });
  const [loading, setLoading] = useState(true);
  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const response = await userAPI.getTeam();
      setTeam(response.data);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getTotalTeamSize = () => {
    return (team.level_1?.length || 0) + 
           (team.level_2?.length || 0) + 
           (team.level_3?.length || 0) + 
           (team.level_4?.length || 0) + 
           (team.level_5?.length || 0) + 
           (team.level_6?.length || 0);
  };

  const MemberCard = ({ member, level }) => {
    const levelColors = {
      1: 'bg-blue-500/20 text-blue-400',
      2: 'bg-purple-500/20 text-purple-400',
      3: 'bg-violet-500/20 text-violet-400',
      4: 'bg-pink-500/20 text-pink-400',
      5: 'bg-orange-500/20 text-orange-400',
      6: 'bg-yellow-500/20 text-yellow-400',
    };

    return (
      <div className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${levelColors[level]} flex items-center justify-center`}>
            <span className="font-bold text-sm">{member.full_name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <p className="text-white font-medium text-sm">{member.full_name}</p>
            <p className="text-gray-500 text-xs">{member.email}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold font-mono text-sm">{formatCurrency(member.total_investment)}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${levelColors[member.level] || levelColors[1]}`}>
            Lv.{member.level}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8" data-testid="team-page">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="team-title">My Team</h1>
        <p className="text-gray-400 text-sm md:text-base">Manage your referrals and track team growth</p>
      </div>

      {/* Referral Info */}
      <div className="glass rounded-xl p-5 md:p-6" data-testid="referral-info">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Share & Earn</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Your Referral Code</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-gray-900/50 rounded-lg px-4 py-3 text-white font-mono text-lg font-bold">
                {user?.referral_code}
              </div>
              <button
                onClick={() => handleCopy(user?.referral_code)}
                className="btn-secondary flex items-center justify-center gap-2"
                data-testid="copy-code-btn"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Referral Link</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-gray-900/50 rounded-lg px-4 py-3 text-blue-400 text-sm break-all">
                {referralLink}
              </div>
              <button
                onClick={() => handleCopy(referralLink)}
                className="btn-primary flex items-center justify-center gap-2"
                data-testid="copy-link-btn"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 md:p-5"
          data-testid="direct-count-card"
        >
          <div className="flex items-center justify-between mb-2">
            <UserPlus className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">{team.level_1?.length || team.direct?.length || 0}</div>
          <div className="text-xs md:text-sm text-gray-400">Direct (Level 1)</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 md:p-5"
          data-testid="indirect-count-card"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            {(team.level_2?.length || 0) + (team.level_3?.length || 0) + (team.level_4?.length || 0) + (team.level_5?.length || 0) + (team.level_6?.length || 0) || team.indirect?.length || 0}
          </div>
          <div className="text-xs md:text-sm text-gray-400">Indirect (L2-L6)</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 md:p-5 col-span-2 md:col-span-1"
          data-testid="total-team-card"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">{getTotalTeamSize()}</div>
          <div className="text-xs md:text-sm text-gray-400">Total Team Size</div>
        </motion.div>
      </div>

      {/* Team Members by Level */}
      <div className="glass rounded-xl p-5 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-white mb-5">Team Members</h2>
        
        <Tabs defaultValue="level_1" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1 bg-gray-900/50 p-1 rounded-lg mb-4">
            {[1, 2, 3, 4, 5, 6].map(level => (
              <TabsTrigger 
                key={level} 
                value={`level_${level}`}
                className="text-xs md:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                L{level} ({team[`level_${level}`]?.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>
          
          {[1, 2, 3, 4, 5, 6].map(level => (
            <TabsContent key={level} value={`level_${level}`}>
              {(team[`level_${level}`]?.length || 0) === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No members at Level {level}</p>
                  <p className="text-gray-600 text-sm mt-1">
                    {level === 1 ? 'Share your referral link to grow your team' : `Your Level ${level-1} members will bring Level ${level} members`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {team[`level_${level}`]?.map((member) => (
                    <MemberCard key={member.user_id} member={member} level={level} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Info Card */}
      <div className="glass rounded-xl p-5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20">
        <h3 className="text-sm font-bold text-white mb-3">Team Building Tips</h3>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <p className="font-bold text-blue-400 mb-1">6 Levels Deep</p>
            <p>Earn commissions from investments made by team members up to 6 levels deep.</p>
          </div>
          <div>
            <p className="font-bold text-purple-400 mb-1">Higher Packages = Higher Commissions</p>
            <p>Upgrade your package to unlock better commission rates on all levels.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
