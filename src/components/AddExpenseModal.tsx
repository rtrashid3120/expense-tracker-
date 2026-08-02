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
  const { wallets, activeWalletId, trips, addExpense } = useAppStore();
  
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
  
  const categories: Category[] = ['Personal', 'Groceries', 'Rent', 'Fuel', 'Medical', 'Family', 'Trip'];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    if (wallets.length > 0 && !walletId) {
      setErrorMsg('Please select a source wallet.');
      return;
    }
    if (category === 'Trip' && !tripId) {
      setErrorMsg('Please select a trip.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    let expenseData: any = {
      amount: parseFloat(amount),
      category,
      note,
      walletId: category === 'Trip' ? undefined : walletId
    };

    if (category === 'Fuel') {
      expenseData = { ...expenseData, liters: parseFloat(liters), odometer: parseFloat(odometer) };
    } else if (category === 'Medical') {
      expenseData = { ...expenseData, familyMember, claimStatus };
    } else if (category === 'Trip') {
      expenseData = { ...expenseData, tripId };
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
    // Mock voice input
    alert("Voice input listening... (e.g., 'Added 200 for lunch')");
    setTimeout(() => {
      setAmount('200');
      setCategory('Personal');
      setNote('Lunch');
    }, 1500);
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 w-full h-[90%] bg-dark-surface/90 backdrop-blur-3xl border-t border-white/10 rounded-t-[40px] z-50 p-8 flex flex-col shadow-[0_-10px_50px_rgba(0,0,0,0.5)] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight">Add Expense</h2>
              <div className="flex gap-3">
                <button type="button" onClick={handleVoiceInput} className="p-3 bg-brand-neon/10 border border-brand-neon/20 rounded-full text-brand-neon hover:bg-brand-neon/20 transition-colors">
                  <FiMic size={20} />
                </button>
                <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 pb-10">
              {wallets.length > 0 && category !== 'Trip' && (
                <div>
                  <label className="text-sm font-bold text-white/60 block mb-2 uppercase tracking-wider">Source Wallet</label>
                  <select 
                    value={walletId} 
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 font-bold text-white outline-none focus:ring-2 focus:ring-brand-neon transition-all appearance-none"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id} className="bg-dark-surface">{w.name} (₹{w.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-bold text-white/60 block mb-2 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/40 font-bold">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-12 pr-6 text-4xl font-black text-white focus:ring-2 focus:ring-brand-neon outline-none transition-all placeholder-white/20"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-white/60 block mb-3 uppercase tracking-wider">Category Domain</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-5 py-3 rounded-2xl whitespace-nowrap font-bold transition-all border ${
                        category === cat 
                          ? 'bg-brand-neon/20 border-brand-neon text-brand-neon shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Domain Forms */}
              <AnimatePresence mode="popLayout">
                {category === 'Fuel' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-bold text-white/60 block mb-2">Liters</label>
                      <input type="number" value={liters} onChange={(e) => setLiters(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-brand-neon placeholder-white/30" placeholder="0.0" />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-bold text-white/60 block mb-2">Odometer</label>
                      <input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-brand-neon placeholder-white/30" placeholder="km" />
                    </div>
                  </motion.div>
                )}

                {category === 'Medical' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-white/60 block mb-2">Family Member</label>
                      <input type="text" value={familyMember} onChange={(e) => setFamilyMember(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-brand-neon placeholder-white/30" placeholder="E.g., Mom" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-white/60 block mb-2">Insurance Claim</label>
                      <select value={claimStatus} onChange={(e) => setClaimStatus(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-brand-neon appearance-none">
                        <option className="bg-dark-surface">None</option>
                        <option className="bg-dark-surface">Pending</option>
                        <option className="bg-dark-surface">Approved</option>
                        <option className="bg-dark-surface">Rejected</option>
                      </select>
                    </div>
                  </motion.div>
                )}
                
                {category === 'Groceries' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-brand-neon/10 rounded-2xl border border-brand-neon/30">
                    <p className="text-sm text-brand-neon font-bold flex items-center gap-2"><FiPlus /> Add Itemized Receipt</p>
                    <p className="text-xs text-white/50 mt-1">Item-level tracking helps calculate price-per-unit inflation over time.</p>
                  </motion.div>
                )}

                {category === 'Trip' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-white/60 block mb-2">Select Trip</label>
                      <select 
                        value={tripId} 
                        onChange={(e) => setTripId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 font-bold text-white outline-none focus:ring-2 focus:ring-brand-neon appearance-none"
                      >
                        {trips.length === 0 && <option value="" className="bg-dark-surface">No trips available</option>}
                        {trips.map(t => (
                          <option key={t.id} value={t.id} className="bg-dark-surface">{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-sm font-bold text-white/60 block mb-2 uppercase tracking-wider">Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-brand-neon outline-none transition-all placeholder-white/30"
                  placeholder="What was this for?"
                />
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold mb-4 border border-red-500/30">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full bg-gradient-to-r from-brand-neon to-brand-purple text-white py-5 rounded-[28px] font-black text-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck size={24} />
                    Save {category} Expense
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
