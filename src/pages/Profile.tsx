import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { FiUser, FiSearch, FiUserPlus, FiCheck, FiAward, FiMap, FiCreditCard, FiUsers } from 'react-icons/fi';
import { api } from '../api';

export function Profile() {
  const { profile, friends, incomingRequests, outgoingRequests, acceptFriendRequest, sendFriendRequest, wallets, trips, expenses } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Gamification logic
  const hasBudgetMaster = expenses.length > 0 && expenses.reduce((a, b) => a + b.amount, 0) < 50000;
  const hasGlobetrotter = trips.length >= 1;
  const hasSocialButterfly = friends.length >= 1;

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        try {
          const results = await api.searchUsers(searchQuery);
          // Filter out current user
          setSearchResults(results.filter(u => u.id !== profile?.id));
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, profile]);

  const handleSendRequest = async (id: string) => {
    try {
      await sendFriendRequest(id);
      alert('Request sent!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="md:hidden mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile & Friends</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Hub */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-brand-neon to-brand-purple flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)] mb-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full rounded-full border-2 border-white/20" alt="avatar" />
              ) : (
                <FiUser size={40} className="text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.full_name || 'User'}</h2>
            <p className="text-brand-neon font-medium">{profile?.username}</p>
            <p className="text-xs text-gray-500 dark:text-white/50 mt-2 truncate px-4">{profile?.email}</p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">User ID</p>
              <p className="text-xs font-mono text-gray-500 dark:text-white/60 truncate">{profile?.id}</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Your Domains</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                <div className="flex items-center gap-3"><FiCreditCard className="text-blue-500" /><span className="font-medium text-sm">Wallets</span></div>
                <span className="font-bold">{wallets.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                <div className="flex items-center gap-3"><FiMap className="text-purple-500" /><span className="font-medium text-sm">Trips</span></div>
                <span className="font-bold">{trips.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                <div className="flex items-center gap-3"><FiUsers className="text-green-500" /><span className="font-medium text-sm">Friends</span></div>
                <span className="font-bold">{friends.length}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiAward className="text-yellow-500" /> Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              {hasBudgetMaster && (
                <div className="px-3 py-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-bold flex items-center gap-1">
                  🛡️ Budget Master
                </div>
              )}
              {hasGlobetrotter && (
                <div className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold flex items-center gap-1">
                  ✈️ Globetrotter
                </div>
              )}
              {hasSocialButterfly && (
                <div className="px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-xs font-bold flex items-center gap-1">
                  🦋 Social
                </div>
              )}
              {!hasBudgetMaster && !hasGlobetrotter && !hasSocialButterfly && (
                <p className="text-xs text-gray-400">Complete actions to earn badges!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Friends System */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Find Friends</h3>
            <div className="relative mb-4">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by @username, email, or User ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-brand-neon outline-none"
              />
            </div>
            
            {searchQuery.length > 0 && (
              <div className="bg-white/80 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-2 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <p className="text-sm text-center py-4 text-gray-500">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => {
                    const isFriend = friends.some(f => f.id === user.id);
                    const isPending = outgoingRequests.some(r => r.id === user.id) || incomingRequests.some(r => r.id === user.id);
                    
                    return (
                    <div key={user.id} className="flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center">
                          {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full" /> : <FiUser />}
                        </div>
                        <div>
                          <p className="text-sm font-bold dark:text-white">{user.full_name || 'User'}</p>
                          <p className="text-xs text-brand-neon">{user.username}</p>
                        </div>
                      </div>
                      {isFriend ? (
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">Friends</span>
                      ) : isPending ? (
                        <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">Pending</span>
                      ) : (
                        <button onClick={() => handleSendRequest(user.id)} className="w-8 h-8 rounded-full bg-brand-neon/20 text-brand-neon flex items-center justify-center hover:bg-brand-neon hover:text-black transition-colors">
                          <FiUserPlus size={16} />
                        </button>
                      )}
                    </div>
                  )})
                ) : (
                  <p className="text-sm text-center py-4 text-gray-500">No users found.</p>
                )}
              </div>
            )}
          </div>

          {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Friend Requests</h3>
              <div className="space-y-2">
                {incomingRequests.map(req => (
                  <div key={req.requestId} className="flex items-center justify-between p-3 bg-white/40 dark:bg-white/5 border border-white/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center">
                        <FiUser />
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-white">{req.full_name || req.username}</p>
                        <p className="text-xs text-gray-500">Wants to be friends</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptFriendRequest(req.requestId)} className="w-8 h-8 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors">
                        <FiCheck />
                      </button>
                    </div>
                  </div>
                ))}
                {outgoingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-white/20 dark:bg-black/20 border border-white/5 rounded-xl opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center"><FiUser size={12}/></div>
                      <p className="text-sm font-medium dark:text-white/80">{req.username}</p>
                    </div>
                    <span className="text-xs text-gray-500">Requested</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Friends ({friends.length})</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500">You don't have any friends yet. Search above to add some!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map(friend => (
                  <div key={friend.id} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 border border-white/20 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full p-[2px]">
                      <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                        {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> : <FiUser className="text-gray-400" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{friend.full_name || 'User'}</p>
                      <p className="text-xs text-brand-neon">{friend.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
