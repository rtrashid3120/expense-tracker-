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

  const handleSubmit = async () => {
    if (!name || !budget) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createWallet(name, parseFloat(budget));
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 w-full md:w-[500px] md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:h-auto md:rounded-3xl h-[80%] bg-white dark:bg-[#0f1423] rounded-t-[40px] z-[60] p-6 md:p-8 flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white">Create New Wallet</h2>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide space-y-6">
              <div className="flex justify-center mb-4 text-brand-600 bg-brand-50 w-20 h-20 mx-auto rounded-full items-center">
                <FiPocket size={40} />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Wallet Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  placeholder="e.g. Monthly Salary, Bike Fund"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Starting Budget / Balance</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-10 pr-5 text-xl font-black text-brand-600 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold mb-4 border border-red-100">
                  {errorMsg}
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !name || !budget}
                className="w-full bg-brand-600 text-white py-5 rounded-[28px] font-bold text-lg shadow-[0_8px_30px_rgba(30,64,175,0.2)] flex justify-center items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
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
