import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { FiUser, FiSearch, FiUserPlus, FiCheck, FiAward, FiMap, FiCreditCard, FiUsers, FiEdit2 } from 'react-icons/fi';
import { api } from '../api';
import { UserProfileModal } from '../components/UserProfileModal';

export function Profile() {
  const navigate = useNavigate();
  const { profile, updateProfile, friends, incomingRequests, outgoingRequests, acceptFriendRequest, sendFriendRequest, wallets, trips, expenses } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditUsername(profile.username || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim()) {
      alert("Username cannot be empty");
      return;
    }
    
    setIsSavingProfile(true);
    try {
      let formattedUsername = editUsername.trim();
      if (!formattedUsername.startsWith('@')) {
        formattedUsername = `@${formattedUsername}`;
      }
      
      await updateProfile({
        full_name: editName.trim(),
        username: formattedUsername
      });
      setIsEditingProfile(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update username');
    } finally {
      setIsSavingProfile(false);
    }
  };

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

            {!isEditingProfile ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.full_name || 'User'}</h2>
                <p className="text-brand-neon font-bold">{profile?.username || '@username'}</p>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-2 truncate px-4">{profile?.email}</p>
                
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-4 px-4 py-1.5 text-xs font-bold bg-white/50 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white rounded-full hover:bg-white/80 dark:hover:bg-white/20 transition-all flex items-center gap-1.5 mx-auto active:scale-95"
                >
                  <FiEdit2 size={12} /> Edit Username & Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-left pt-2">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider text-center">Edit Profile</h3>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-neon"
                    placeholder="Your Full Name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-brand-neon rounded-xl py-2 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-neon"
                    placeholder="@username"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 py-2 text-xs font-bold bg-brand-neon text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Friend Code</p>
              <p className="text-xl font-mono font-bold text-gray-900 dark:text-white tracking-[0.2em]">{profile?.short_id || profile?.id?.substring(0, 7)}</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Your Domains</h3>
            <div className="space-y-3">
              <div onClick={() => navigate('/')} className="cursor-pointer flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3"><FiCreditCard className="text-blue-500" /><span className="font-medium text-sm">Wallets</span></div>
                <span className="font-bold">{wallets.length}</span>
              </div>
              <div onClick={() => navigate('/trips')} className="cursor-pointer flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3"><FiMap className="text-purple-500" /><span className="font-medium text-sm">Trips</span></div>
                <span className="font-bold">{trips.length}</span>
              </div>
              <div onClick={() => navigate('/profile')} className="cursor-pointer flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20 hover:shadow-md transition-shadow">
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

        {/* Right Column: Friends System (Side by Side Grid) */}
        <div className="md:col-span-2 space-y-6">
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

          {/* Side-By-Side Grid for Find Friends & My Friends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Find Friends Card */}
            <div className="glass-card p-6 flex flex-col min-h-[320px]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Find Friends</h3>
              <div className="relative mb-4">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search @username, email, or Code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-brand-neon outline-none text-sm"
                />
              </div>
              
              {searchQuery.length > 0 ? (
                <div className="bg-white/80 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-2 max-h-64 overflow-y-auto flex-1 scrollbar-hide">
                  {isSearching ? (
                    <p className="text-sm text-center py-4 text-gray-500">Searching...</p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(user => {
                      const isFriend = friends.some(f => f.id === user.id);
                      const isPending = outgoingRequests.some(r => r.id === user.id) || incomingRequests.some(r => r.id === user.id);
                      
                      return (
                      <div key={user.id} className="flex items-center justify-between p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                        <div onClick={() => setSelectedUser(user)} className="flex items-center gap-3 cursor-pointer">
                          <div className="w-9 h-9 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <FiUser size={14} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold dark:text-white">{user.full_name || 'User'}</p>
                            <p className="text-[10px] text-brand-neon">@{user.username?.replace(/^@/, '')}</p>
                          </div>
                        </div>
                        {isFriend ? (
                          <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Friends</span>
                        ) : isPending ? (
                          <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">Pending</span>
                        ) : (
                          <button onClick={() => handleSendRequest(user.id)} className="w-7 h-7 rounded-full bg-brand-neon/20 text-brand-neon flex items-center justify-center hover:bg-brand-neon hover:text-black transition-colors">
                            <FiUserPlus size={14} />
                          </button>
                        )}
                      </div>
                    )})
                  ) : (
                    <p className="text-sm text-center py-4 text-gray-500">No users found.</p>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-gray-400 dark:text-white/40">
                  <FiSearch size={28} className="mb-2 opacity-50" />
                  <p className="text-xs">Type a username, email, or Friend Code to search.</p>
                </div>
              )}
            </div>

            {/* My Friends Card */}
            <div className="glass-card p-6 flex flex-col min-h-[320px]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-gray-400 dark:text-white/40">
                  <FiUsers size={28} className="mb-2 opacity-50" />
                  <p className="text-xs">No friends added yet. Search on the left to add!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 flex-1 scrollbar-hide">
                  {friends.map(friend => (
                    <div key={friend.id} onClick={() => setSelectedUser(friend)} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 border border-white/20 rounded-xl cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full p-[2px] shrink-0">
                        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                          {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> : <FiUser className="text-gray-400" size={14} />}
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{friend.full_name || friend.username || 'User'}</p>
                        <p className="text-[10px] text-brand-neon truncate">@{friend.username?.replace(/^@/, '')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </div>
  );
}
