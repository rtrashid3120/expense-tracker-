import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiPlus, FiMic } from 'react-icons/fi';
import { useAppStore } from '../store';
import type { Category } from '../store';

export function AddExpenseModal({ 
  isOpen, 
  onClose,
  initialCategory = 'Personal',
  initialTripId
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialCategory?: Category;
  initialTripId?: string;
}) {
  const { wallets, activeWalletId, trips, addExpense, createTrip } = useAppStore();
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(initialCategory);
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState<string>('');
  const [tripId, setTripId] = useState<string>(initialTripId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Domain specific state
  const [liters, setLiters] = useState('');
  const [odometer, setOdometer] = useState('');
  const [familyMember, setFamilyMember] = useState('');
  const [claimStatus, setClaimStatus] = useState('None');
  const [isListening, setIsListening] = useState(false);
  
  // Category Domains state with persistence
  const defaultCategories: string[] = ['Personal', 'Groceries', 'Rent', 'Fuel', 'Medical', 'Travel'];
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_category_domains');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const categories = [...defaultCategories, ...customCategories];

  const handleSwitchWallet = () => {
    if (wallets.length <= 1) return;
    const currentIndex = wallets.findIndex(w => w.id === walletId);
    const nextIndex = (currentIndex + 1) % wallets.length;
    setWalletId(wallets[nextIndex].id);
  };

  const handleAddCustomCategory = () => {
    const name = window.prompt("Enter new Category Domain name (e.g. Chappals, Hotel, Food, Bike, Household):");
    if (!name || !name.trim()) return;
    
    const formattedName = name.trim();
    const categoryName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);

    if (!categories.some(c => c.toLowerCase() === categoryName.toLowerCase())) {
      const updated = [...customCategories, categoryName];
      setCustomCategories(updated);
      try {
        localStorage.setItem('custom_category_domains', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setCategory(categoryName as any);
    } else {
      const existing = categories.find(c => c.toLowerCase() === categoryName.toLowerCase());
      if (existing) setCategory(existing as any);
    }
  };

  // Set default wallet and category when opened
  useEffect(() => {
    if (isOpen) {
      if (activeWalletId) setWalletId(activeWalletId);
      else if (wallets.length > 0) setWalletId(wallets[0].id);
      
      setCategory(initialCategory);
      if (initialTripId) {
        setTripId(initialTripId);
      } else if (trips.length > 0) {
        setTripId(trips[0].id);
      }
    }
  }, [isOpen, activeWalletId, wallets, initialCategory, initialTripId, trips]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      setAmount('');
      return;
    }
    // Parse into number and format with commas (Indian numbering system)
    const formatted = new Intl.NumberFormat('en-IN').format(parseInt(rawValue, 10));
    setAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    // Determine target trip
    const targetTripId = initialTripId || (category === 'Travel' ? tripId : undefined);

    if (wallets.length > 0 && !targetTripId && !walletId) {
      setErrorMsg('Please select a source wallet.');
      return;
    }
    if (category === 'Travel' && !targetTripId) {
      setErrorMsg('Please select a trip.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    // Remove commas before parsing to float
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));

    let expenseData: any = {
      amount: parsedAmount,
      category,
      note,
      walletId: targetTripId ? undefined : walletId
    };

    if (category === 'Fuel') {
      expenseData = { ...expenseData, liters: parseFloat(liters) || 0, odometer: parseFloat(odometer) || 0 };
    } else if (category === 'Medical') {
      expenseData = { ...expenseData, familyMember, claimStatus };
    }
    
    if (targetTripId) {
      expenseData.tripId = targetTripId;
    }

    try {
      await addExpense(expenseData);
      // Reset on success
      setAmount(''); setNote(''); setLiters(''); setOdometer(''); setFamilyMember(''); setCategory(initialCategory);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please use Google Chrome or Safari on desktop, or Chrome on Android.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMsg('');
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      
      const matchNumber = speechResult.match(/\d+/);
      if (matchNumber) {
        setAmount(new Intl.NumberFormat('en-IN').format(parseInt(matchNumber[0], 10)));
      }
      
      const text = speechResult;
      if (text.includes('grocery') || text.includes('groceries')) setCategory('Groceries');
      else if (text.includes('rent')) setCategory('Rent');
      else if (text.includes('fuel') || text.includes('petrol') || text.includes('gas')) setCategory('Fuel');
      else if (text.includes('medical') || text.includes('doctor') || text.includes('hospital') || text.includes('pharmacy')) setCategory('Medical');
      else if (text.includes('travel') || text.includes('trip')) setCategory('Travel');
      else setCategory('Personal');

      let noteStr = speechResult
        .replace(/add|spent|paid|for|rupees|rs/g, '')
        .replace(/\d+/g, '')
        .trim();
      
      if (noteStr) {
        setNote(noteStr.charAt(0).toUpperCase() + noteStr.slice(1));
      }
    };

    recognition.onerror = (event: any) => {
      setErrorMsg("Voice recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };



  const handleCreateTrip = async () => {
    const name = window.prompt("Enter new trip name:");
    if (!name) return;
    const budgetStr = window.prompt("Enter total budget for trip:", "1000");
    const budget = budgetStr ? parseFloat(budgetStr) : 0;
    try {
      await createTrip({
        name,
        totalBudget: budget,
        groupSize: 1,
        image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80',
        balances: []
      });
    } catch (e: any) {
      alert(e.message || "Failed to create trip");
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
            className="fixed bottom-0 w-full md:w-3/4 lg:w-1/2 left-1/2 -translate-x-1/2 max-h-[92vh] md:max-h-[85vh] bg-white/95 dark:bg-dark-surface/90 backdrop-blur-3xl border-t border-gray-200 dark:border-white/10 rounded-t-[32px] sm:rounded-t-[40px] z-[101] p-4 sm:p-8 flex flex-col shadow-[0_-10px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add Expense</h2>
              <div className="flex gap-2 sm:gap-3">
                <button type="button" onClick={handleVoiceInput} className={`p-2.5 sm:p-3 border rounded-full transition-colors ${isListening ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 animate-pulse' : 'bg-blue-50 dark:bg-brand-neon/10 border-blue-200 dark:border-brand-neon/20 text-blue-600 dark:text-brand-neon hover:bg-blue-100 dark:hover:bg-brand-neon/20'}`}>
                  <FiMic size={18} />
                </button>
                <button onClick={onClose} className="p-2.5 sm:p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 sm:space-y-6 scrollbar-hide pb-4">
                {initialTripId ? (
                  <div className="p-3.5 sm:p-4 bg-brand-50 dark:bg-brand-neon/10 border border-brand-200 dark:border-brand-neon/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-neon uppercase tracking-wider">Logging Expense For Trip</p>
                      <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white mt-0.5">✈️ {trips.find(t => t.id === initialTripId)?.name || 'Current Trip'}</p>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold bg-brand-100 dark:bg-brand-neon/20 text-brand-700 dark:text-brand-neon px-2.5 py-1 rounded-full">Trip Mode</span>
                  </div>
                ) : (
                  category !== 'Travel' && (
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Source Wallet</label>
                      <div className="flex gap-2">
                        <select 
                          value={walletId} 
                          onChange={(e) => setWalletId(e.target.value)}
                          className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 sm:py-4 px-4 font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon transition-all appearance-none text-sm"
                        >
                          {wallets.length === 0 && <option value="" className="bg-white dark:bg-dark-surface">No wallets available</option>}
                          {wallets.map(w => (
                            <option key={w.id} value={w.id} className="bg-white dark:bg-dark-surface">{w.name} (₹{w.balance.toLocaleString()})</option>
                          ))}
                        </select>
                        <button type="button" onClick={handleSwitchWallet} className="px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors" title="Switch between created wallets">
                          <FiPlus size={20} />
                        </button>
                      </div>
                    </div>
                  )
                )}

                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl text-gray-400 dark:text-white/40 font-bold">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amount}
                      onChange={handleAmountChange}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 text-2xl sm:text-4xl font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all placeholder-gray-300 dark:placeholder-white/20"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Category Domain</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat as any)}
                        className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl whitespace-nowrap text-xs sm:text-sm font-bold transition-all border ${
                          category === cat 
                            ? 'bg-blue-50 dark:bg-brand-neon/20 border-blue-600 dark:border-brand-neon text-blue-700 dark:text-brand-neon shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-2xl flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
                      title="Add Custom Category Domain"
                    >
                      <FiPlus size={18} />
                    </button>
                  </div>
                </div>

                {/* Dynamic Domain Forms */}
                <AnimatePresence mode="popLayout">
                  {category === 'Fuel' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Liters</label>
                        <input type="number" value={liters} onChange={(e) => setLiters(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon placeholder-gray-400 dark:placeholder-white/30" placeholder="0.0" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Odometer</label>
                        <input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon placeholder-gray-400 dark:placeholder-white/30" placeholder="km" />
                      </div>
                    </motion.div>
                  )}

                  {category === 'Medical' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Family Member</label>
                        <input type="text" value={familyMember} onChange={(e) => setFamilyMember(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon placeholder-gray-400 dark:placeholder-white/30" placeholder="E.g., Mom" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Insurance Claim</label>
                        <select value={claimStatus} onChange={(e) => setClaimStatus(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon appearance-none">
                          <option className="bg-white dark:bg-dark-surface">None</option>
                          <option className="bg-white dark:bg-dark-surface">Pending</option>
                          <option className="bg-white dark:bg-dark-surface">Approved</option>
                          <option className="bg-white dark:bg-dark-surface">Rejected</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                  
                  {category === 'Groceries' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3.5 bg-blue-50 dark:bg-brand-neon/10 rounded-xl border border-blue-200 dark:border-brand-neon/30">
                      <p className="text-xs text-blue-600 dark:text-brand-neon font-bold flex items-center gap-1.5"><FiPlus /> Add Itemized Receipt</p>
                      <p className="text-[10px] text-gray-500 dark:text-white/50 mt-0.5">Item-level tracking helps calculate price inflation.</p>
                    </motion.div>
                  )}

                  {category === 'Travel' && !initialTripId && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Select Trip</label>
                        <div className="flex gap-2">
                          <select 
                            value={tripId} 
                            onChange={(e) => setTripId(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 font-bold text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon appearance-none"
                          >
                            {trips.length === 0 && <option value="" className="bg-white dark:bg-dark-surface">No trips available</option>}
                            {trips.map(t => (
                              <option key={t.id} value={t.id} className="bg-white dark:bg-dark-surface">{t.name}</option>
                            ))}
                          </select>
                          <button type="button" onClick={handleCreateTrip} className="px-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <FiPlus size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Note (Optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 sm:py-4 px-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all placeholder-gray-400 dark:placeholder-white/30"
                    placeholder="What was this for?"
                  />
                </div>
              </div>

              {/* Fixed Bottom Action Area */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex-shrink-0">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold mb-3 border border-red-200 dark:border-red-500/30">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white py-4 sm:py-5 rounded-[24px] sm:rounded-[28px] font-black text-base sm:text-lg shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiCheck size={20} />
                      Save {category} Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
