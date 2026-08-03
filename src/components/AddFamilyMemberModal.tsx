import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiSearch, FiArrowRight } from 'react-icons/fi';
import { useAppStore } from '../store';
import { api } from '../api';
import type { FamilyMember } from '../store';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddFamilyMemberModal({ isOpen, onClose }: AddFamilyMemberModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [allocatedBudget, setAllocatedBudget] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const addFamilyMember = useAppStore(state => state.addFamilyMember);
  const familyPools = useAppStore(state => state.familyPools);
  const activeFamilyPoolId = useAppStore(state => state.activeFamilyPoolId);
  const activePool = familyPools.find(p => p.id === activeFamilyPoolId);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchUsers(searchQuery);
        // Filter out existing family members in this pool
        const existingIds = activePool?.members.map(m => m.id) || [];
        setSearchResults(results.filter(r => !existingIds.includes(r.id)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activePool]);

  const handleSelectUser = (user: { id: string; name: string; avatar?: string }) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedUser || !allocatedBudget || !activeFamilyPoolId) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newMember: FamilyMember = {
        id: selectedUser.id,
        name: selectedUser.name,
        avatar: selectedUser.avatar,
        budget: parseFloat(allocatedBudget),
        spent: 0
      };

      await addFamilyMember(activeFamilyPoolId, newMember);
      
      // Reset & Close
      setSelectedUser(null);
      setAllocatedBudget('');
      setStep(1);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add family member.');
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 max-h-[90vh] md:max-h-[85vh] w-full md:w-[540px] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 bg-white/95 dark:bg-dark-surface/95 border border-gray-200 dark:border-white/10 rounded-t-[32px] md:rounded-3xl z-[101] p-4 sm:p-6 md:p-8 flex flex-col shadow-2xl backdrop-blur-3xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8 flex-shrink-0">
              <h2 className="text-2xl font-bold dark:text-white">
                {step === 1 ? 'Invite Family Member' : 'Allocate Budget'}
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
                        autoFocus
                      />
                      {isSearching && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-2 space-y-1 z-10 max-h-[60vh] overflow-y-auto">
                        {searchResults.map(user => (
                          <div 
                            key={user.id} 
                            onClick={() => handleSelectUser(user)}
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
                            <button className="text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FiArrowRight size={24} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🤷‍♂️</div>
                        <p>No users found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    {/* Selected User Overview */}
                    <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-3xl border border-gray-100">
                      {selectedUser?.avatar ? (
                        <img src={selectedUser.avatar} alt={selectedUser.name} className="w-20 h-20 rounded-full mb-4 shadow-sm" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-3xl mb-4">
                          {selectedUser?.name.charAt(0)}
                        </div>
                      )}
                      <h3 className="font-black text-xl text-gray-900">{selectedUser?.name}</h3>
                      <p className="text-sm font-medium text-gray-500">{selectedUser?.id}</p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-2">Monthly Sub-budget for {selectedUser?.name.split(' ')[0]}</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={allocatedBudget}
                          onChange={(e) => setAllocatedBudget(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-5 pl-12 pr-6 text-2xl font-black text-brand-600 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          placeholder="0"
                          autoFocus
                        />
                      </div>
                      <p className="text-xs font-medium text-gray-500 mt-3 text-center">
                        This budget will be drawn from your total Family pool.
                      </p>
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
              
              {step === 2 && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !allocatedBudget}
                  className="w-full bg-brand-600 text-white py-5 rounded-[28px] font-bold text-lg shadow-[0_8px_30px_rgba(30,64,175,0.2)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiCheck size={24} />
                      Add to Family
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
