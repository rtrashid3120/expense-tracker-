import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { FiSearch, FiTrash2, FiFileText, FiCalendar, FiTag, FiShoppingBag, FiTruck } from 'react-icons/fi';

export function AuditTrailPage() {
  const { expenses, deleteExpense } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Groceries', 'Transport', 'Rent', 'Dining', 'Shopping', 'Personal', 'Medical', 'Fuel', 'Travel'];

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.note && exp.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exp.amount.toString().includes(searchQuery);
    
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense from the audit trail?')) {
      try {
        await deleteExpense(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete expense');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 max-w-5xl mx-auto pb-28"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FiFileText className="text-blue-600 dark:text-brand-neon" />
            Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60 font-medium mt-1">
            Complete transaction history and ledger records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-2xl shadow-sm text-right">
            <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider">Filtered Total</p>
            <p className="text-lg font-black text-blue-600 dark:text-brand-neon">
              ₹{totalFilteredAmount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit records by category, amount, or note..."
            className="w-full bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon transition-all shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-blue-600 dark:bg-brand-neon text-white dark:text-black border-blue-600 dark:border-brand-neon shadow-sm'
                  : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit List */}
      <div className="glass-card p-4 sm:p-6 shadow-xl">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-white/40">
            <FiFileText size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-bold text-base text-gray-600 dark:text-white/60">No Audit Records Found</p>
            <p className="text-xs mt-1">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredExpenses.map((expense) => {
                const items = (expense as any).items || (expense as any).details?.items;
                return (
                  <motion.div
                    key={expense.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 dark:hover:border-white/20 transition-all shadow-sm"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-brand-neon/10 text-blue-600 dark:text-brand-neon flex items-center justify-center font-bold text-lg shrink-0 mt-0.5">
                        {expense.category === 'Groceries' ? <FiShoppingBag size={18} /> : expense.category === 'Fuel' ? <FiTruck size={18} /> : <FiTag size={18} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                            {expense.category}
                          </p>
                          <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FiCalendar size={10} />
                            {expense.date}
                          </span>
                        </div>

                        {expense.note && (
                          <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5 font-medium">
                            {expense.note}
                          </p>
                        )}

                        {/* Render Batch Items if present */}
                        {items && Array.isArray(items) && items.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/10 space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider">Included Items ({items.length}):</p>
                            <div className="flex flex-wrap gap-1.5">
                              {items.map((it: any, idx: number) => (
                                <span key={idx} className="text-[11px] font-semibold bg-blue-50 dark:bg-brand-neon/10 text-blue-700 dark:text-brand-neon px-2.5 py-0.5 rounded-lg">
                                  {it.name}: ₹{it.price} {it.quantity > 1 ? `(x${it.quantity})` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5">
                      <p className="font-black text-base sm:text-lg text-gray-900 dark:text-white">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </p>

                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                        title="Delete Record"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
