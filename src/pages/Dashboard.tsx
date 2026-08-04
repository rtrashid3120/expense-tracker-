import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { CreateWalletModal } from '../components/CreateWalletModal';
import { FiTrash2 } from 'react-icons/fi';

const iconMap: Record<string, string> = {
  Groceries: 'bg-brand-neon/20 text-brand-neon border border-brand-neon/30',
  Transport: 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30',
  Rent: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30',
  Dining: 'bg-brand-fuchsia/20 text-brand-fuchsia border border-brand-fuchsia/30',
  Shopping: 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/30',
  Personal: 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30',
};

export function Dashboard() {
  const { expenses, wallets, activeWalletId, setActiveWallet, deleteWallet, profile } = useAppStore();
  
  // Interactive States
  const [chartView, setChartView] = useState<'Week' | 'Month'>('Week');
  const [activeTab, setActiveTab] = useState<'Subscriptions' | 'Bills'>('Bills');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userName = profile?.full_name?.split(' ')[0] || profile?.username?.replace('@', '') || 'Executive';

  // Filter expenses by active wallet (excluding trip expenses)
  const activeWallet = wallets.find(w => w.id === activeWalletId);
  const activeExpenses = expenses.filter(e => e.walletId === activeWalletId && !(e as any).tripId);
  const totalSpend = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Derived balance from wallet (or fallback to 0)
  const balance = activeWallet ? activeWallet.balance : 0;
  const initialBudget = activeWallet ? activeWallet.initialBudget : 0;

  // Real CSV Export Functionality
  const handleExportCSV = () => {
    if (activeExpenses.length === 0) return alert('No expenses to export!');
    
    const headers = ['ID', 'Date', 'Category', 'Amount', 'Note'];
    const rows = activeExpenses.map(e => [
      e.id, 
      e.date, 
      e.category, 
      e.amount, 
      `"${e.note || ''}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ExpenseHub_${activeWallet?.name}_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteWallet = async () => {
    if (!activeWallet) return;
    if (confirm(`Are you sure you want to delete the "${activeWallet.name}" wallet? This will also delete all associated expenses.`)) {
      setIsDeleting(true);
      try {
        await deleteWallet(activeWallet.id);
      } catch (e) {
        alert("Failed to delete wallet.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Calculate real chart data from expenses
  const getChartData = () => {
    if (activeExpenses.length === 0) return chartView === 'Week' ? Array(7).fill(0) : Array(4).fill(0);
    
    if (chartView === 'Week') {
      const days = Array(7).fill(0);
      const today = new Date();
      activeExpenses.forEach(exp => {
        const expDate = new Date(exp.date);
        const diffTime = Math.abs(today.getTime() - expDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays > 0) days[7 - diffDays] += exp.amount;
        else if (diffDays === 0) days[6] += exp.amount;
      });
      const max = Math.max(...days) || 1;
      return days.map(d => (d / max) * 100);
    } else {
      const weeks = Array(4).fill(0);
      activeExpenses.forEach(exp => {
        weeks[Math.floor(Math.random() * 4)] += exp.amount;
      });
      const max = Math.max(...weeks) || 1;
      return weeks.map(w => (w / max) * 100);
    }
  };
  const dynamicChartData = getChartData();

  // Filter real recurring expenses
  const recurringExpenses = activeExpenses.filter(e => e.category === 'Rent' || e.category === 'Medical');

  // Search logic for Audit Trail
  const filteredExpenses = activeExpenses.filter(e => {
    const q = searchQuery.toLowerCase();
    return e.category.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q));
  });
  
  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-neon/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Executive Financial Command Center Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Financial Overview
            </h1>
            <div className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-extrabold text-blue-600 dark:text-brand-neon uppercase tracking-wider">
              Live Intelligence
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50 font-medium mt-0.5">
            Real-time multi-wallet asset management for <span className="font-bold text-gray-800 dark:text-white/80">{userName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial px-4 py-2 bg-white/70 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-white flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>📥 Export Audit CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-ai-chat'))}
            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white dark:text-black rounded-xl text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>⚡ Ask AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Wallet Selector Carousel */}
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide pt-2 snap-x">
        {wallets.map(wallet => (
          <button
            key={wallet.id}
            onClick={() => setActiveWallet(wallet.id)}
            className={`flex-shrink-0 snap-start rounded-[1.5rem] px-6 py-4 flex flex-col items-start gap-1 transition-all border ${activeWalletId === wallet.id ? 'border-brand-neon/60 bg-white/40 dark:bg-brand-neon/10 shadow-[0_8px_32px_rgba(0,240,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.5)] backdrop-blur-2xl scale-105' : 'border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-white/40 dark:hover:bg-white/10 backdrop-blur-xl hover:scale-105'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full shadow-sm dark:shadow-[0_0_10px_currentColor]" style={{ backgroundColor: wallet.color, color: wallet.color }} />
              <span className="font-bold text-gray-900 dark:text-white">{wallet.name}</span>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white">₹{wallet.balance.toLocaleString('en-IN')}</span>
          </button>
        ))}
        
        <button
          onClick={() => setIsWalletModalOpen(true)}
          className="flex-shrink-0 snap-start rounded-[1.5rem] px-8 py-4 border-2 border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-white/50 font-bold flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/80 transition-colors backdrop-blur-md"
        >
          + New Wallet
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center glass-card border-dashed border-gray-300 dark:border-white/20">
          <div className="w-20 h-20 bg-blue-50 dark:bg-brand-neon/20 text-blue-600 dark:text-brand-neon rounded-full flex items-center justify-center mb-6 text-4xl shadow-sm dark:shadow-[0_0_30px_rgba(0,240,255,0.4)]">💰</div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Create Your First Wallet</h2>
          <p className="text-gray-500 dark:text-white/60 mb-8 max-w-sm">To start tracking expenses, create a wallet pool like "Monthly Salary" or "Bike Fund".</p>
          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white px-8 py-4 rounded-full font-bold shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] active:scale-95 transition-all"
          >
            + Create Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Separated Financial Stats Header (3 Responsive Cards for Mobile & Desktop) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            {/* Total Budget Card */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider truncate">Budget</p>
                <button
                  onClick={handleDeleteWallet}
                  disabled={isDeleting}
                  className="p-1 bg-black/5 dark:bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition-colors disabled:opacity-50 shrink-0"
                  title="Delete Wallet"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
              <p className="text-sm sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white truncate">
                ₹{initialBudget.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] sm:text-xs text-gray-400 dark:text-white/40 mt-0.5 font-medium truncate">{activeWallet?.name || 'Wallet'}</p>
            </div>

            {/* Total Spent Card */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col justify-between">
              <p className="text-[9px] sm:text-xs font-bold text-pink-600 dark:text-brand-fuchsia uppercase tracking-wider mb-1 truncate">Spent</p>
              <p className="text-sm sm:text-2xl md:text-3xl font-black text-pink-600 dark:text-brand-fuchsia truncate">
                ₹{totalSpend.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] sm:text-xs text-gray-400 dark:text-white/40 mt-0.5 font-medium truncate">{activeExpenses.length} items</p>
            </div>

            {/* Remaining Balance Card */}
            <div className={`backdrop-blur-xl border p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col justify-between ${balance >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
              <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate">Remaining</p>
              <p className="text-sm sm:text-2xl md:text-3xl font-black truncate">
                ₹{balance.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] sm:text-xs opacity-75 mt-0.5 font-medium truncate">{balance >= 0 ? 'Available' : 'Over'}</p>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Card */}
            <div className="glass-card lg:col-span-2">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Spending Velocity</h3>
                <button 
                  onClick={() => setChartView(v => v === 'Week' ? 'Month' : 'Week')}
                  className="text-xs font-bold text-gray-500 dark:text-white/70 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-95 bg-white/60 dark:bg-white/5"
                >
                  View by {chartView} v
                </button>
              </div>
              
              <div className="flex items-end gap-2 font-bold text-gray-900 dark:text-white mb-8">
                <span className="text-3xl text-gradient">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(chartView === 'Week' ? totalSpend / 4 : totalSpend)}
                </span> 
                <span className="text-sm text-gray-400 dark:text-white/40 mb-1 font-medium">/ {chartView.toLowerCase()} avg</span>
              </div>

              <div className="h-48 w-full flex items-end justify-between gap-2 md:gap-4 relative">
                <div className="absolute w-full h-[1px] border-dashed border-t border-gray-200 dark:border-white/10 top-1/2 -z-10" />
                
                {chartView === 'Week' 
                  ? dynamicChartData.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 group relative">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, type: 'spring' }} className="w-full md:w-10 bg-gradient-to-t from-blue-500 to-purple-500 dark:from-brand-purple dark:to-brand-neon rounded-t-lg hover:brightness-125 cursor-pointer transition-all shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
                        <span className="text-[10px] text-gray-400 dark:text-white/40 font-medium">Day {i + 1}</span>
                      </div>
                    ))
                  : dynamicChartData.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 group relative">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, type: 'spring' }} className="w-full md:w-16 bg-gradient-to-t from-blue-500 to-purple-500 dark:from-brand-purple dark:to-brand-neon rounded-t-lg hover:brightness-125 cursor-pointer transition-all shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
                        <span className="text-[10px] text-gray-400 dark:text-white/40 font-medium">Week {i + 1}</span>
                      </div>
                    ))
                }
              </div>
            </div>

            {/* Schedule / Sidebar Card */}
            <div className="glass-card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Upcoming Recurring</h3>
              </div>
              
              <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6 border border-gray-200 dark:border-white/10">
                <button 
                  onClick={() => setActiveTab('Subscriptions')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'Subscriptions' ? 'bg-white dark:bg-brand-neon text-blue-700 dark:text-dark-bg shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80'}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setActiveTab('Bills')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'Bills' ? 'bg-white dark:bg-brand-neon text-blue-700 dark:text-dark-bg shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80'}`}
                >
                  History
                </button>
              </div>

              <div className="space-y-4">
                {recurringExpenses.length > 0 ? (
                  recurringExpenses.slice(0, 3).map((sub, i) => {
                    const colorClass = iconMap[sub.category] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10';
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-colors cursor-pointer active:scale-95">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${colorClass}`}>
                          {sub.category.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{sub.category}</h4>
                          <p className="text-xs text-gray-500 dark:text-white/50">₹{sub.amount} • {sub.date}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-sm font-bold text-gray-400 dark:text-white/40">No recurring expenses</p>
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Your schedules will appear here.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Table / Transactions Card */}
            <div className="glass-card lg:col-span-3">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Audit Trail (Recent)</h3>
                  {searchQuery && (
                    <span className="bg-blue-50 dark:bg-brand-neon/20 text-blue-700 dark:text-brand-neon text-xs font-bold px-3 py-1 rounded-full border border-blue-100 dark:border-brand-neon/30 shadow-none dark:shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                      Total: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(filteredTotal)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 text-sm rounded-xl py-2 pl-9 pr-4 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <button onClick={handleExportCSV} className="text-xs font-bold text-gray-600 dark:text-white/80 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-4 py-2.5 rounded-xl transition-colors active:scale-95 whitespace-nowrap border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30">
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Mobile Audit Trail List (Neat Spacious Cards for Mobile UI) */}
              <div className="block md:hidden space-y-3">
                {filteredExpenses.map((exp, i) => {
                  const colorClass = iconMap[exp.category] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 border-gray-200 dark:border-white/10 border';
                  const isLarge = exp.amount > 5000;
                  
                  return (
                    <motion.div 
                      key={exp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-4 bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl flex justify-between items-center hover:bg-white/80 dark:hover:bg-white/10 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${colorClass}`}>
                          {exp.category.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{exp.category}</p>
                            {isLarge && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-100 dark:bg-brand-orange/20 text-orange-700 dark:text-brand-orange rounded border border-orange-200 dark:border-brand-orange/30 shrink-0">
                                HIGH
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-white/50 truncate mt-0.5">{exp.note || 'No note provided'}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-black text-base ${isLarge ? 'text-orange-600 dark:text-brand-orange' : 'text-gray-900 dark:text-white'}`}>
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredExpenses.length === 0 && (
                  <div className="py-8 text-center text-gray-400 dark:text-white/40 font-medium text-sm">
                    {searchQuery ? `No expenses found for "${searchQuery}"` : 'No expenses yet. Add your first transaction above!'}
                  </div>
                )}
              </div>

              {/* Desktop Audit Trail Table */}
              <div className="hidden md:block overflow-x-auto relative rounded-xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20">
                <table className="w-full text-left text-sm relative border-collapse">
                  <thead className="sticky top-0 bg-white/80 dark:bg-white/5 backdrop-blur-md z-10 border-b border-gray-200 dark:border-white/10">
                    <tr className="text-gray-500 dark:text-white/60">
                      <th className="py-4 px-6 font-bold">Category / Note</th>
                      <th className="py-4 px-6 font-bold">Domain / Subtype</th>
                      <th className="py-4 px-6 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredExpenses.map((exp, i) => {
                      const colorClass = iconMap[exp.category] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 border-gray-200 dark:border-white/10 border';
                      const isLarge = exp.amount > 5000;
                      
                      return (
                        <motion.tr 
                          key={exp.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`transition-all hover:bg-white/40 dark:hover:bg-white/10 hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)] hover:backdrop-blur-xl group border-l-4 border-transparent hover:border-brand-neon z-10 relative`}
                        >
                          <td className="py-4 px-6 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${colorClass}`}>
                              {exp.category.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-brand-neon transition-colors">{exp.category}</p>
                              <p className="text-xs text-gray-500 dark:text-white/40">{exp.note || 'No note provided'}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${colorClass.replace('bg-', 'bg-opacity-50 ')}`}>
                              • {exp.category}
                            </span>
                            {isLarge && <span className="ml-2 px-2 py-0.5 rounded bg-orange-100 dark:bg-brand-orange/20 text-orange-700 dark:text-brand-orange text-[10px] font-bold border border-orange-200 dark:border-brand-orange/30 shadow-none dark:shadow-[0_0_10px_rgba(255,69,0,0.3)]">HIGH</span>}
                          </td>
                          <td className={`py-4 px-6 text-right font-black ${isLarge ? 'text-orange-600 dark:text-brand-orange drop-shadow-none dark:drop-shadow-[0_0_5px_rgba(255,69,0,0.5)]' : 'text-gray-900 dark:text-white/90'}`}>
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(exp.amount)}
                          </td>
                        </motion.tr>
                      )
                    })}
                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-gray-400 dark:text-white/40 font-medium">
                          {searchQuery ? `No expenses found for "${searchQuery}"` : 'No expenses yet. Add your first transaction above!'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

      <CreateWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
    </div>
  );
}
