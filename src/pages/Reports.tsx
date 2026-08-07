import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import type { Expense } from '../store';
import { FiX } from 'react-icons/fi';

export function Reports() {
  const expenses = useAppStore(state => state.expenses);
  const wallets = useAppStore(state => state.wallets);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('ALL');

  // Generate calendar for the current month
  const calendarData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Group expenses by date string (YYYY-MM-DD)
    const expensesByDate: Record<string, Expense[]> = {};
    let maxDaily = 1; // Avoid division by zero

    expenses.forEach(exp => {
      if (!expensesByDate[exp.date]) {
        expensesByDate[exp.date] = [];
      }
      expensesByDate[exp.date].push(exp);
    });

    // Find the max daily spend for calculating heatmap intensity
    Object.values(expensesByDate).forEach(dayExpenses => {
      const sum = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
      if (sum > maxDaily) maxDaily = sum;
    });

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      // Format to YYYY-MM-DD
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayExpenses = expensesByDate[dateStr] || [];
      const sum = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
      
      const intensity = sum / maxDaily;
      
      let color = 'bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/5'; // empty
      let textColor = 'text-gray-400 dark:text-white/30';
      if (intensity > 0.8) {
        color = 'bg-orange-500 dark:bg-brand-orange shadow-md dark:shadow-[0_0_15px_rgba(255,69,0,0.6)]'; textColor = 'text-white font-bold drop-shadow-md';
      } else if (intensity > 0.4) {
        color = 'bg-pink-500 dark:bg-brand-fuchsia shadow-md dark:shadow-[0_0_15px_rgba(255,0,255,0.6)]'; textColor = 'text-white font-bold drop-shadow-md';
      } else if (intensity > 0) {
        color = 'bg-blue-400 dark:bg-brand-neon/60 shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.3)]'; textColor = 'text-white font-bold';
      }

      days.push({
        dayNum: i,
        dateStr,
        expenses: dayExpenses,
        total: sum,
        color,
        textColor
      });
    }

    return days;
  }, [expenses]);

  const selectedDayData = calendarData.find(d => d.dateStr === selectedDate);

  // Dynamic Expenses & Total filtered by Selected Wallet
  const dayFilteredExpenses = useMemo(() => {
    if (!selectedDayData) return [];
    if (selectedWalletId === 'ALL') return selectedDayData.expenses;
    return selectedDayData.expenses.filter(e => {
      const expWId = e.walletId || (e as any).wallet_id;
      return expWId === selectedWalletId;
    });
  }, [selectedDayData, selectedWalletId]);

  const dayFilteredTotal = useMemo(() => {
    return dayFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [dayFilteredExpenses]);

  const getWalletName = (wId?: string) => {
    if (!wId) return null;
    const w = wallets.find(item => item.id === wId || (item as any)._id === wId);
    return w ? w.name : null;
  };

  // Simple padding for the first day of the month
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 max-w-5xl mx-auto pb-24">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8 mt-4 tracking-tight">Insights</h1>

      {/* Spend Heatmap */}
      <div className="glass-card mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Spend Heatmap</h2>
        <p className="text-xs text-gray-500 dark:text-white/50 mb-6">Click on any colored day to view your expenses.</p>
        
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={`header-${i}`} className="text-center text-xs font-bold text-gray-400 dark:text-white/40 mb-2">{d}</div>
          ))}
          
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
          ))}

          {calendarData.map((day) => (
            <motion.div
              key={day.dateStr}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              onClick={() => {
                setSelectedDate(day.dateStr);
                setSelectedWalletId('ALL');
              }}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative ${day.color} ${selectedDate === day.dateStr ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-dark-bg ring-blue-500 dark:ring-brand-neon scale-110 z-20' : ''}`}
            >
              <span className={`text-sm md:text-base ${day.textColor}`}>{day.dayNum}</span>
              {day.total > 0 && (
                <span className="text-[8px] md:text-[10px] text-white/90 absolute bottom-1 hidden md:block drop-shadow-md font-bold">
                  ₹{day.total > 1000 ? (day.total/1000).toFixed(1)+'k' : day.total}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected Day Expenses */}
      <AnimatePresence mode="wait">
        {selectedDate && selectedDayData && (
          <motion.div 
            key={selectedDate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Expenses for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-sm font-semibold text-gray-500 dark:text-white/60 mt-1">
                  Filtered Spend: <span className="text-orange-600 dark:text-brand-orange drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,69,0,0.5)]">₹{dayFilteredTotal.toLocaleString('en-IN')}</span>
                </p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 rounded-full transition-colors active:scale-95">
                <FiX size={20} />
              </button>
            </div>

            {/* Wallet Selection Filter Pills */}
            {wallets.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedWalletId('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border flex items-center gap-1.5 cursor-pointer ${
                    selectedWalletId === 'ALL'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white dark:text-black border-transparent shadow-md'
                      : 'bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  👛 All Wallets (₹{selectedDayData.total.toLocaleString('en-IN')})
                </button>

                {wallets.map(w => {
                  const wId = w.id || (w as any)._id;
                  const wExpensesOnDate = selectedDayData.expenses.filter(e => (e.walletId || (e as any).wallet_id) === wId);
                  const wTotalOnDate = wExpensesOnDate.reduce((sum, e) => sum + e.amount, 0);
                  const isSelected = selectedWalletId === wId;

                  return (
                    <button
                      key={wId}
                      type="button"
                      onClick={() => setSelectedWalletId(wId)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 dark:bg-brand-neon text-white dark:text-black border-purple-600 dark:border-brand-neon shadow-md'
                          : 'bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      👛 {w.name} (₹{wTotalOnDate.toLocaleString('en-IN')})
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/20">
                        {wExpensesOnDate.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {dayFilteredExpenses.length > 0 ? (
              <div className="space-y-3">
                {dayFilteredExpenses.map((exp) => {
                  const wName = getWalletName(exp.walletId || (exp as any).wallet_id);
                  return (
                    <div key={exp.id} className="flex justify-between items-center p-4 bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl transition-colors">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">{exp.category}</span>
                          {wName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-white/10 border border-blue-200 dark:border-white/20 text-blue-700 dark:text-brand-neon">
                              👛 {wName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-white/50 mt-0.5">{exp.note || 'No notes'}</span>
                      </div>
                      <span className="font-black text-gray-900 dark:text-white text-lg">₹{exp.amount.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/60 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                <div className="text-4xl mb-3 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">🍃</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">No spending</h4>
                <p className="text-sm text-gray-500 dark:text-white/40">No transactions recorded for this wallet on this date.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
