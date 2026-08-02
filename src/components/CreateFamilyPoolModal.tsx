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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !budget) return;

    setIsSubmitting(true);
    setError('');

    try {
      await createFamilyPool(name, parseFloat(budget));
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 w-full bg-white dark:bg-[#0f1423] rounded-t-[40px] z-50 p-8 flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white">New Family Pool</h2>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-8">
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Pool Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-4 px-6 font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="e.g., Groceries"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Total Budget</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-4 pl-12 pr-6 font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !name || !budget}
                className="mt-4 w-full bg-brand-600 text-white py-5 rounded-[28px] font-bold text-lg shadow-[0_8px_30px_rgba(30,64,175,0.2)] flex justify-center items-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
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
