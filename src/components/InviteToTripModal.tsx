import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiSearch, FiCopy, FiLink, FiUser } from 'react-icons/fi';
import { useAppStore } from '../store';
import { api } from '../api';
import type { Trip } from '../store';

interface InviteToTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

export function InviteToTripModal({ isOpen, onClose, trip }: InviteToTripModalProps) {
  const [activeTab, setActiveTab] = useState<'Search' | 'Link'>('Search');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const { friends, addMemberToTrip } = useAppStore();
  const [searchType, setSearchType] = useState<'username' | 'email' | 'code'>('username');

  // Generate a mock invite link
  const inviteLink = `https://expensehub.app/invite/${trip.name.toLowerCase().replace(/\s+/g, '-')}-${trip.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        let results = await api.searchUsers(searchQuery);
        
        // Filter based on selected type if needed
        if (searchType === 'email') {
          results = results.filter(r => r.email?.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (searchType === 'username') {
          results = results.filter(r => r.username?.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (searchType === 'code') {
          results = results.filter(r => r.short_id === searchQuery || r.id?.startsWith(searchQuery));
        }

        // Don't filter out users already in the trip, just pass the raw results so the UI can show them as 'Added'
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, trip, searchType]);

  const handleAddUser = async (user: any) => {
    try {
      // Use exact username or full_name as the identifier
      const name = user.username || user.full_name || user.name || 'User';
      await addMemberToTrip(trip.id, { userId: name, balance: 0 });
      setSearchQuery('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to add user to trip.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 w-full max-h-[92vh] md:max-h-[85vh] md:w-[560px] md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 bg-white/95 dark:bg-dark-surface/95 border border-gray-200 dark:border-white/10 rounded-t-[32px] md:rounded-3xl z-[101] p-4 sm:p-6 md:p-8 flex flex-col shadow-2xl overflow-hidden backdrop-blur-3xl"
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Invite Friends</h2>
              <button onClick={onClose} className="p-2.5 sm:p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-4 sm:mb-6 flex-shrink-0 border border-gray-200 dark:border-white/10">
              <button 
                onClick={() => setActiveTab('Search')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'Search' ? 'bg-white dark:bg-brand-neon/20 shadow-sm text-brand-600 dark:text-brand-neon' : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80'}`}
              >
                Find & Invite
              </button>
              <button 
                onClick={() => setActiveTab('Link')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'Link' ? 'bg-white dark:bg-brand-neon/20 shadow-sm text-brand-600 dark:text-brand-neon' : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80'}`}
              >
                Shareable Link
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4 scrollbar-hide">
              <AnimatePresence mode="wait">
                {activeTab === 'Search' ? (
                  <motion.div
                    key="Search"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6 flex flex-col h-full"
                  >
                    <div className="relative">
                      <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" size={20} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-14 pr-6 font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-neon outline-none transition-all"
                        placeholder={`Search via ${searchType === 'code' ? 'Friend Code' : searchType}...`}
                        autoFocus
                      />
                      {isSearching && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-200 dark:border-brand-neon/30 border-t-brand-600 dark:border-t-brand-neon rounded-full animate-spin" />
                      )}
                    </div>
                    
                    <div className="flex gap-2 mb-2">
                      <button onClick={() => setSearchType('username')} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${searchType === 'username' ? 'bg-brand-50 dark:bg-brand-neon/20 border-brand-200 dark:border-brand-neon/40 text-brand-600 dark:text-brand-neon' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5'}`}>@username</button>
                      <button onClick={() => setSearchType('email')} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${searchType === 'email' ? 'bg-brand-50 dark:bg-brand-neon/20 border-brand-200 dark:border-brand-neon/40 text-brand-600 dark:text-brand-neon' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5'}`}>Email</button>
                      <button onClick={() => setSearchType('code')} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${searchType === 'code' ? 'bg-brand-50 dark:bg-brand-neon/20 border-brand-200 dark:border-brand-neon/40 text-brand-600 dark:text-brand-neon' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5'}`}>Friend Code</button>
                    </div>

                    {searchQuery.length < 2 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-white/50 mb-3 uppercase tracking-wider">My Friends</h3>
                        {friends.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-white/40">You don't have any friends yet. Search above to invite someone!</p>
                        ) : (
                          <div className="space-y-2">
                            {friends.map(friend => {
                              const isAlreadyInTrip = trip.balances.some(b => b.userId.toLowerCase() === (friend.full_name?.split(' ')[0].toLowerCase() || friend.username?.toLowerCase()));
                              return (
                                <div key={friend.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-neon to-brand-purple p-[2px]">
                                      <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                                        {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> : <FiUser className="text-gray-400 dark:text-white/40" />}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900 dark:text-white text-sm">{friend.full_name || friend.username}</p>
                                      <p className="text-xs text-brand-neon">{friend.username}</p>
                                    </div>
                                  </div>
                                  {isAlreadyInTrip ? (
                                    <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full">Added</span>
                                  ) : (
                                    <button onClick={() => handleAddUser({ id: friend.id, name: friend.full_name || friend.username, avatar: friend.avatar_url })} className="text-brand-600 dark:text-brand-neon bg-brand-50 dark:bg-brand-neon/10 hover:bg-brand-100 dark:hover:bg-brand-neon/20 px-3 py-1.5 rounded-full text-xs font-bold transition-colors">
                                      Add
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl shadow-lg p-2 space-y-1 z-10 max-h-[50vh] overflow-y-auto">
                        {searchResults.map(user => {
                          const isAlreadyInTrip = trip.balances.some(b => b.userId.toLowerCase() === (user.full_name?.split(' ')[0].toLowerCase() || user.username?.toLowerCase() || ''));
                          return (
                          <div 
                            key={user.id} 
                            onClick={() => !isAlreadyInTrip && handleAddUser(user)}
                            className={`flex items-center justify-between p-4 rounded-xl transition-colors group ${isAlreadyInTrip ? 'opacity-70 cursor-default' : 'hover:bg-brand-50 dark:hover:bg-white/10 cursor-pointer'}`}
                          >
                            <div className="flex items-center gap-4">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name || user.username} className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-neon/20 text-brand-600 dark:text-brand-neon flex items-center justify-center font-bold text-lg">
                                  {(user.full_name || user.username)?.charAt(0)?.toUpperCase() || <FiUser />}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{user.full_name || user.username}</p>
                                <p className="text-sm text-gray-500 dark:text-brand-neon">{user.username || user.id}</p>
                              </div>
                            </div>
                            {isAlreadyInTrip ? (
                              <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-4 py-2 rounded-full">Added</span>
                            ) : (
                              <button className="text-brand-600 dark:text-black font-bold bg-brand-100 dark:bg-brand-neon px-4 py-2 rounded-full text-sm hover:bg-brand-200 dark:hover:bg-white transition-colors">
                                Invite
                              </button>
                            )}
                          </div>
                        )})}
                      </div>
                    )}
                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-white/50">
                        <div className="text-4xl mb-4">🤷‍♂️</div>
                        <p className="font-bold">No users found matching "{searchQuery}"</p>
                        <p className="text-sm mt-2">Try sharing an invite link instead.</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="Link"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center justify-center h-full py-8 text-center"
                  >
                    <div className="w-20 h-20 bg-brand-50 dark:bg-brand-neon/10 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-neon mb-6">
                      <FiLink size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Share Invite Link</h3>
                    <p className="text-gray-500 dark:text-white/60 mb-8 max-w-[250px]">
                      Anyone with this link will be able to join <strong className="text-gray-900 dark:text-white">{trip.name}</strong> and view balances.
                    </p>
                    
                    <div className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{inviteLink}</p>
                      </div>
                      <button 
                        onClick={handleCopy}
                        className={`p-3 rounded-xl flex-shrink-0 transition-all ${isCopied ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20'}`}
                      >
                        {isCopied ? <FiCheck size={20} /> : <FiCopy size={20} />}
                      </button>
                    </div>
                    {isCopied && <p className="text-green-600 dark:text-green-400 text-sm font-bold mt-4 animate-pulse">Link copied to clipboard!</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
