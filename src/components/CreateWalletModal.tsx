import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiPocket } from 'react-icons/fi';
import { useAppStore } from '../store';

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWalletModal({ isOpen, onClose }: CreateWalletModalProps) {
  const createWallet = useAppStore(state => state.createWallet);
  
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      setBudget('');
      return;
    }
    const formatted = new Intl.NumberFormat('en-IN').format(parseInt(rawValue, 10));
    setBudget(formatted);
  };

  const handleSubmit = async () => {
    if (!name || !budget) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    const parsedBudget = parseFloat(budget.replace(/,/g, ''));

    try {
      await createWallet(name, parsedBudget);
      setName('');
      setBudget('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create wallet.');
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Wallet</h2>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide space-y-6">
              <div className="flex justify-center mb-4 text-blue-600 dark:text-brand-neon bg-blue-50 dark:bg-brand-neon/10 border border-transparent dark:border-brand-neon/30 w-20 h-20 mx-auto rounded-full items-center shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <FiPocket size={40} />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-white/60 block mb-2">Wallet Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-5 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all placeholder-gray-400 dark:placeholder-white/30"
                  placeholder="e.g. Monthly Salary, Bike Fund"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-white/60 block mb-2">Starting Budget / Balance</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg text-gray-400 dark:text-white/40 font-bold">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={budget}
                    onChange={handleBudgetChange}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-5 text-xl font-black text-blue-600 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all placeholder-gray-300 dark:placeholder-white/20"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/10 mt-auto">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold mb-4 border border-red-100 dark:border-red-500/30">
                  {errorMsg}
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !name || !budget}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white py-5 rounded-[28px] font-bold text-lg shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:scale-100 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck size={24} />
                    Create Wallet
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
