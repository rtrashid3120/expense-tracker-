import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import type { Expense } from '../store';
import { 
  FiX, 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight, 
  FiRotateCcw 
} from 'react-icons/fi';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function Reports() {
  const expenses = useAppStore(state => state.expenses);
  const wallets = useAppStore(state => state.wallets);
  
  const today = new Date();
  const currentRealYear = today.getFullYear();
  const currentRealMonth = today.getMonth();

  // Active Selected Month & Year
  const [selectedYear, setSelectedYear] = useState<number>(currentRealYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);
  
  // Selected Day in Heatmap
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('ALL');

  // Quick navigation: Previous Month
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
    setSelectedDate(null);
  };

  // Quick navigation: Next Month
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
    setSelectedDate(null);
  };

  // Quick reset to current month & year
  const handleGoToCurrentMonth = () => {
    setSelectedYear(currentRealYear);
    setSelectedMonth(currentRealMonth);
    setSelectedDate(null);
  };


  // Generate calendar data for the selected month and year
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // Group expenses by date string (YYYY-MM-DD)
    const expensesByDate: Record<string, Expense[]> = {};
    let maxDaily = 1; // Avoid division by zero

    expenses.forEach(exp => {
      if (!exp.date) return;
      // Normalize date string (YYYY-MM-DD)
      const rawDateStr = exp.date.split('T')[0];
      if (!expensesByDate[rawDateStr]) {
        expensesByDate[rawDateStr] = [];
      }
      expensesByDate[rawDateStr].push(exp);
    });

    // Find the max daily spend in the selected month for calculating heatmap intensity
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayExpenses = expensesByDate[dateStr] || [];
      const sum = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
      if (sum > maxDaily) maxDaily = sum;
    }

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayExpenses = expensesByDate[dateStr] || [];
      const sum = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
      
      const intensity = maxDaily > 0 ? sum / maxDaily : 0;
      
      let color = 'bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/5'; // empty
      let textColor = 'text-gray-400 dark:text-white/30';
      if (intensity > 0.8) {
        color = 'bg-orange-500 dark:bg-brand-orange shadow-md dark:shadow-[0_0_15px_rgba(255,69,0,0.6)]'; 
        textColor = 'text-white font-bold drop-shadow-md';
      } else if (intensity > 0.4) {
        color = 'bg-pink-500 dark:bg-brand-fuchsia shadow-md dark:shadow-[0_0_15px_rgba(255,0,255,0.6)]'; 
        textColor = 'text-white font-bold drop-shadow-md';
      } else if (intensity > 0) {
        color = 'bg-blue-400 dark:bg-brand-neon/60 shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.3)]'; 
        textColor = 'text-white font-bold';
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
  }, [expenses, selectedYear, selectedMonth]);

  // Monthly Overview Metrics
  const monthStats = useMemo(() => {
    let totalSpend = 0;
    let totalTransactions = 0;
    let activeDays = 0;

    calendarData.forEach(d => {
      if (d.total > 0) {
        totalSpend += d.total;
        totalTransactions += d.expenses.length;
        activeDays += 1;
      }
    });

    return { totalSpend, totalTransactions, activeDays };
  }, [calendarData]);

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

  // Padding for the first day of the selected month
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 max-w-5xl mx-auto pb-24">
      {/* Header & Date Selector Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Insights & Heatmaps</h1>
          <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
            Visualizing daily spending intensity across months.
          </p>
        </div>

        {/* Month / Year Navigator Bar */}
        <div className="flex items-center gap-2 bg-white/70 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <button
            onClick={handlePrevMonth}
            title="Previous Month"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
          >
            <FiChevronLeft size={18} />
          </button>

          {/* Interactive Native Date Picker */}
          <div className="relative shrink-0 flex-1 sm:w-48">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-brand-neon z-10 pointer-events-none" size={16} />
            <input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const [y, m, _d] = val.split('-');
                  setSelectedYear(parseInt(y, 10));
                  setSelectedMonth(parseInt(m, 10) - 1);
                  setSelectedDate(val);
                  setSelectedWalletId('ALL');
                } else {
                  setSelectedDate(null);
                }
              }}
              title="Choose Date"
              className="w-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-brand-neon/15 dark:to-brand-purple/15 border border-blue-200 dark:border-brand-neon/30 rounded-xl py-2 pl-9 pr-3 text-sm font-black text-blue-700 dark:text-brand-neon outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon transition-all shadow-sm [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
            />
          </div>

          <button
            onClick={handleNextMonth}
            title="Next Month"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
          >
            <FiChevronRight size={18} />
          </button>

          {/* Reset to Current Month Button if not already on it */}
          {(selectedYear !== currentRealYear || selectedMonth !== currentRealMonth) && (
            <button
              onClick={handleGoToCurrentMonth}
              title="Jump to Current Month"
              className="ml-1 px-2.5 py-1.5 rounded-xl bg-blue-500 dark:bg-brand-neon text-white dark:text-black font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <FiRotateCcw size={12} />
              <span className="hidden sm:inline">Today</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {/* Monthly Summary Glass Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 order-2 md:order-1">
        <div className="glass-card p-4 flex flex-col">
          <span className="text-[11px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider">Total Spend</span>
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
            ₹{monthStats.totalSpend.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-white/40 mt-1 font-medium">in {MONTH_SHORT[selectedMonth]} {selectedYear}</span>
        </div>

        <div className="glass-card p-4 flex flex-col">
          <span className="text-[11px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider">Transactions</span>
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
            {monthStats.totalTransactions}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-white/40 mt-1 font-medium">expenses logged</span>
        </div>

        <div className="glass-card p-4 flex flex-col">
          <span className="text-[11px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider">Active Days</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-brand-neon mt-1">
            {monthStats.activeDays} <span className="text-sm font-normal text-gray-400 dark:text-white/40">/ {calendarData.length}</span>
          </span>
          <span className="text-[10px] text-gray-500 dark:text-white/40 mt-1 font-medium">days with spend</span>
        </div>
      </div>

      {/* Spend Heatmap Grid */}
      <div className="glass-card mb-8 order-1 md:order-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{MONTH_NAMES[selectedMonth]} {selectedYear} Heatmap</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-white/50">Click on any colored day to view and filter that date's expenses.</p>
          </div>

          {/* Intensity Legend */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-white/60 self-start sm:self-auto">
            <span>Low</span>
            <div className="w-3.5 h-3.5 rounded-md bg-blue-400 dark:bg-brand-neon/60"></div>
            <div className="w-3.5 h-3.5 rounded-md bg-pink-500 dark:bg-brand-fuchsia"></div>
            <div className="w-3.5 h-3.5 rounded-md bg-orange-500 dark:bg-brand-orange"></div>
            <span>High</span>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={`header-${i}`} className="text-center text-xs font-bold text-gray-400 dark:text-white/40 mb-1">{d}</div>
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
      </div>

      {/* Selected Day Expenses Breakdown */}
      <AnimatePresence mode="wait">
        {selectedDate && selectedDayData && (
          <motion.div 
            key={selectedDate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card mb-8"
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
              <button 
                onClick={() => setSelectedDate(null)} 
                className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
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

      {/* ========================================================= */}
      {/* 📅 MONTH & YEAR CALENDAR SELECTION MODAL */}
      {/* ========================================================= */}

    </motion.div>
  );
}
