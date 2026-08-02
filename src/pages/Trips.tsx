import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import type { Trip } from '../store';
import { optimizeDebts } from '../utils/debtOptimizer';
import type { Transaction } from '../utils/debtOptimizer';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { InviteToTripModal } from '../components/InviteToTripModal';
import { AddExpenseModal } from '../components/AddExpenseModal';

export function Trips() {
  const trips = useAppStore(state => state.trips);
  const expenses = useAppStore(state => state.expenses);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Filter expenses for this specific trip
  const tripExpenses = useMemo(() => {
    if (!selectedTrip) return [];
    return expenses.filter(e => e.category === 'Travel' && (e as any).tripId === selectedTrip.id);
  }, [expenses, selectedTrip]);

  // Generate raw debts dynamically from the selected trip's balances
  const rawDebts = useMemo(() => {
    if (!selectedTrip) return [];
    
    // Convert balances to a mock transaction format for the optimizer
    const creditors = selectedTrip.balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = selectedTrip.balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const transactions: Transaction[] = [];
    let c = 0, d = 0;
    
    while (c < creditors.length && d < debtors.length) {
      const creditor = creditors[c];
      const debtor = debtors[d];
      
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
      
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount
      });
      
      creditor.balance -= amount;
      debtor.balance += amount;
      
      if (creditor.balance === 0) c++;
      if (debtor.balance === 0) d++;
    }
    
    return transactions;
  }, [selectedTrip]);

  const optimizedDebts = useMemo(() => optimizeDebts(rawDebts), [rawDebts]);

  if (selectedTrip) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 md:p-6 pb-24 max-w-5xl mx-auto">
        <button onClick={() => setSelectedTrip(null)} className="text-blue-600 dark:text-brand-neon font-bold mb-6 hover:text-blue-800 dark:hover:text-white transition-colors">← Back to Trips</button>
        
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{selectedTrip.name}</h1>
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-gray-500 dark:text-white/60">Total Budget: ₹{selectedTrip.totalBudget.toLocaleString()}</p>
            <p className="text-blue-600 dark:text-brand-neon font-bold mt-1 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">Spent: ₹{selectedTrip.spent.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 dark:text-white/50 uppercase tracking-widest font-bold">Remaining</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">₹{(selectedTrip.totalBudget - selectedTrip.spent).toLocaleString()}</p>
          </div>
        </div>
        
        {/* Trip Expenses List */}
        <div className="mb-8 glass-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Trip Expenses</h2>
          </div>
          
          {tripExpenses.length === 0 ? (
            <div className="bg-white/60 dark:bg-white/5 rounded-3xl p-8 text-center border border-gray-200 dark:border-white/10 border-dashed shadow-sm">
              <div className="text-4xl mb-3 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">✈️</div>
              <p className="text-gray-500 dark:text-white/50 font-medium">No expenses logged for this trip yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {tripExpenses.map(expense => (
                <div key={expense.id} className="bg-white/60 dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white/80 dark:hover:bg-white/10 transition-colors shadow-sm">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-brand-neon">{expense.note || 'Trip Expense'}</p>
                    <p className="text-xs text-gray-500 dark:text-white/40 mt-1">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-black text-gray-900 dark:text-white text-lg drop-shadow-md">₹{expense.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-gradient">Debt Settlement Optimizer</h2>
          <p className="text-sm text-gray-500 dark:text-white/50 mb-8">Graph-minimized transactions to settle up efficiently without everyone paying everyone.</p>
          
          <div className="space-y-4">
            {optimizedDebts.map((debt, i) => (
              <div key={i} className="flex justify-between items-center p-5 bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-2xl transition-all">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">{debt.from}</span>
                  <span className="text-gray-500 dark:text-white/40 text-sm">owes</span>
                  <span className="font-bold text-blue-600 dark:text-brand-neon">{debt.to}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-black text-gray-900 dark:text-white text-xl drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">₹{debt.amount}</span>
                  <button 
                    onClick={() => alert(`Redirecting to UPI app to pay ₹${debt.amount} to ${debt.to}...`)}
                    className="text-xs bg-blue-50 dark:bg-brand-neon/20 border border-blue-200 dark:border-brand-neon/30 text-blue-700 dark:text-brand-neon font-bold px-4 py-1.5 rounded-full mt-2 hover:bg-blue-100 dark:hover:bg-brand-neon/30 transition-colors active:scale-95 shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                  >
                    UPI Pay
                  </button>
                </div>
              </div>
            ))}
            {optimizedDebts.length === 0 && (
              <div className="text-center py-6 text-gray-400 dark:text-white/40 font-medium">All debts settled! 🎉</div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => setIsInviteOpen(true)}
            className="flex-1 bg-white/60 dark:bg-white/5 text-gray-700 dark:text-white border border-gray-300 dark:border-white/20 py-4 rounded-2xl font-bold active:scale-95 transition-transform hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur-md"
          >
            + Invite Friends
          </button>
          <button 
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]"
          >
            + Add Trip Expense
          </button>
        </div>
        
        <InviteToTripModal 
          isOpen={isInviteOpen} 
          onClose={() => setIsInviteOpen(false)} 
          trip={selectedTrip} 
        />
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          initialCategory="Travel"
          initialTripId={selectedTrip.id}
        />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 pb-24 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8 mt-4 tracking-tight">Groups & Trips</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips.map((trip, i) => (
          <motion.div 
            key={trip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => setSelectedTrip(trip)}
            className="p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer relative overflow-hidden group"
          >
            {/* Colorful Glow Blob */}
            <div className={`absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${i % 2 === 0 ? 'bg-blue-500 dark:bg-brand-neon' : 'bg-pink-500 dark:bg-brand-fuchsia'}`} />
            
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 relative z-10">{trip.name}</h2>
            <div className="flex justify-between items-end relative z-10">
              <div className="bg-white/80 dark:bg-black/30 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5">
                <p className="text-sm font-bold text-gray-700 dark:text-white/80">₹{trip.totalBudget.toLocaleString()}</p>
              </div>
              <div className="flex -space-x-3">
                {trip.balances.map((m, idx) => (
                  <div key={m.userId} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-surface text-blue-600 dark:text-brand-neon flex items-center justify-center text-sm font-black border-2 border-white dark:border-white/10 z-10 shadow-sm dark:shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ zIndex: 10 - idx }}>
                    {m.userId.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <button 
        onClick={() => setIsCreateOpen(true)}
        className="mt-8 w-full border-2 border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-white/50 py-6 rounded-3xl font-bold hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/80 hover:border-gray-400 dark:hover:border-white/30 transition-all active:scale-95 backdrop-blur-sm"
      >
        + Create New Group
      </button>
      
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </motion.div>
  );
}
