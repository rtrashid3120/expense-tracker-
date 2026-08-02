import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiSearch, FiCopy, FiLink, FiArrowRight } from 'react-icons/fi';
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
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const addMemberToTrip = useAppStore(state => state.addMemberToTrip);

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
        const results = await api.searchUsers(searchQuery);
        // Filter out users already in the trip
        const existingIds = trip.balances.map(b => b.userId.toLowerCase());
        setSearchResults(results.filter(r => !existingIds.includes(r.id.toLowerCase()) && !existingIds.includes(r.name.toLowerCase())));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, trip]);

  const handleAddUser = async (user: { id: string; name: string; avatar?: string }) => {
    try {
      // Use the name or ID as the userId in the balance array (depending on how CreateGroupModal does it)
      // For simplicity, we use their name as the identifier to match existing mock data structure
      const displayName = user.name.split(' ')[0]; // use first name
      await addMemberToTrip(trip.id, { userId: displayName, balance: 0 });
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 w-full h-[85%] bg-white dark:bg-[#0f1423] rounded-t-[40px] z-50 p-6 md:p-8 flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold dark:text-white">Invite Friends</h2>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex bg-gray-50 dark:bg-gray-800 rounded-xl p-1 mb-6 flex-shrink-0">
              <button 
                onClick={() => setActiveTab('Search')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'Search' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Search Directory
              </button>
              <button 
                onClick={() => setActiveTab('Link')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'Link' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Shareable Link
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
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
                      <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        placeholder="Search by name or @id..."
                        autoFocus
                      />
                      {isSearching && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-2 space-y-1 z-10 max-h-[50vh] overflow-y-auto">
                        {searchResults.map(user => (
                          <div 
                            key={user.id} 
                            onClick={() => handleAddUser(user)}
                            className="flex items-center justify-between p-4 hover:bg-brand-50 rounded-xl cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full bg-gray-200" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.id}</p>
                              </div>
                            </div>
                            <button className="text-brand-600 font-bold bg-brand-100 px-4 py-2 rounded-full text-sm hover:bg-brand-200 transition-colors">
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">🤷‍♂️</div>
                        <p className="font-medium">No users found matching "{searchQuery}"</p>
                        <p className="text-sm text-gray-400 mt-2">Try sharing an invite link instead.</p>
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
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-6">
                      <FiLink size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Share Invite Link</h3>
                    <p className="text-gray-500 mb-8 max-w-[250px]">
                      Anyone with this link will be able to join <strong>{trip.name}</strong> and view balances.
                    </p>
                    
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">{inviteLink}</p>
                      </div>
                      <button 
                        onClick={handleCopy}
                        className={`p-3 rounded-xl flex-shrink-0 transition-all ${isCopied ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                      >
                        {isCopied ? <FiCheck size={20} /> : <FiCopy size={20} />}
                      </button>
                    </div>
                    {isCopied && <p className="text-green-600 text-sm font-bold mt-4 animate-pulse">Link copied to clipboard!</p>}
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
