import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck } from 'react-icons/fi';
import { useAppStore } from '../store';

interface CreateFamilyPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateFamilyPoolModal({ isOpen, onClose }: CreateFamilyPoolModalProps) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createFamilyPool = useAppStore(state => state.createFamilyPool);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      setBudget('');
      return;
    }
    const formatted = new Intl.NumberFormat('en-IN').format(parseInt(rawValue, 10));
    setBudget(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !budget) return;

    setIsSubmitting(true);
    setError('');

    const parsedBudget = parseFloat(budget.replace(/,/g, ''));

    try {
      await createFamilyPool(name, parsedBudget);
      setName('');
      setBudget('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create family pool');
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
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 w-full md:w-[500px] md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 bg-white dark:bg-dark-surface/90 border dark:border-white/10 md:rounded-3xl rounded-t-[40px] z-50 p-8 flex flex-col shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Family Pool</h2>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-8">
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-white/60 block mb-2">Pool Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-6 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all placeholder-gray-400 dark:placeholder-white/30"
                  placeholder="e.g., Groceries"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-white/60 block mb-2">Total Budget</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-white/40 font-bold">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={budget}
                    onChange={handleBudgetChange}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-6 font-bold text-blue-600 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all placeholder-gray-300 dark:placeholder-white/20"
                    placeholder="0"
                  />
                </div>
              </div>

              {error && <p className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !name || !budget}
                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white py-5 rounded-[28px] font-bold text-lg shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck size={24} />
                    Create Pool
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
