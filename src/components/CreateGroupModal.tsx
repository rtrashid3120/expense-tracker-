import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiSearch, FiUserPlus, FiArrowRight } from 'react-icons/fi';
import { useAppStore } from '../store';
import { api } from '../api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Members state (always includes 'You')
  const [members, setMembers] = useState<{ id: string; name: string }[]>([{ id: 'You', name: 'You' }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const createTrip = useAppStore(state => state.createTrip);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchUsers(searchQuery);
        // Filter out already added members
        setSearchResults(results.filter(r => !members.some(m => m.id === r.id)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, members]);

  const handleAddMember = (user: { id: string; name: string }) => {
    setMembers([...members, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (id: string) => {
    if (id === 'You') return;
    setMembers(members.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!name || !budget) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const balances = members.map(m => ({
        userId: m.name.split(' ')[0], // Using first name for simplicity in this mock
        balance: 0
      }));

      await createTrip({
        name,
        totalBudget: parseFloat(budget),
        groupSize: members.length,
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
        balances
      });
      
      // Reset & Close
      setName(''); setBudget(''); setMembers([{ id: 'You', name: 'You' }]); setStep(1);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            className="absolute bottom-0 w-full h-[90%] bg-white dark:bg-[#0f1423] rounded-t-[40px] z-50 p-8 flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8 flex-shrink-0">
              <h2 className="text-2xl font-bold dark:text-white">
                {step === 1 ? 'New Group' : 'Invite Friends'}
              </h2>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-2">Group Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-xl font-bold focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        placeholder="e.g. Goa Weekend 🌴"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-2">Total Budget Estimate</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-6 text-xl font-bold focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6 flex flex-col h-full"
                  >
                    {/* Search Bar */}
                    <div className="relative">
                      <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        placeholder="Search by name or @id..."
                      />
                      {isSearching && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Search Results Dropdown-style */}
                    {searchResults.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-2 space-y-1 z-10 max-h-48 overflow-y-auto">
                        {searchResults.map(user => (
                          <div 
                            key={user.id} 
                            onClick={() => handleAddMember(user)}
                            className="flex items-center justify-between p-3 hover:bg-brand-50 rounded-xl cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-gray-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.id}</p>
                              </div>
                            </div>
                            <button className="text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FiUserPlus size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="text-center py-4 text-sm text-gray-500">No users found.</div>
                    )}

                    {/* Added Members */}
                    <div className="flex-1 mt-4">
                      <h3 className="text-sm font-bold text-gray-700 mb-4">Added Members ({members.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {members.map(m => (
                            <motion.div
                              key={m.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-medium text-sm border border-gray-200"
                            >
                              <span>{m.name}</span>
                              {m.id !== 'You' && (
                                <button onClick={() => handleRemoveMember(m.id)} className="text-gray-400 hover:text-red-500 ml-1">
                                  <FiX size={16} />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-gray-100 flex-shrink-0">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold mb-4 border border-red-100">
                  {errorMsg}
                </div>
              )}
              
              {step === 1 ? (
                <button
                  onClick={() => setStep(2)}
                  disabled={!name || !budget}
                  className="w-full bg-brand-600 text-white py-5 rounded-[28px] font-bold text-lg shadow-[0_8px_30px_rgba(30,64,175,0.2)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all"
                >
                  Next Step
                  <FiArrowRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-brand-600 text-white py-5 rounded-[28px] font-bold text-lg shadow-[0_8px_30px_rgba(30,64,175,0.2)] flex justify-center items-center gap-2 disabled:opacity-70 active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiCheck size={24} />
                      Create Group
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
