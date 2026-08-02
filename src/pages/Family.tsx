import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { AddFamilyMemberModal } from '../components/AddFamilyMemberModal';
import { CreateFamilyPoolModal } from '../components/CreateFamilyPoolModal';

export function Family() {
  const { familyPools, activeFamilyPoolId, setActiveFamilyPool, expenses } = useAppStore();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);

  // If data hasn't loaded yet
  if (!familyPools) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-white/10 border-t-brand-neon rounded-full animate-spin"></div>
      </div>
    );
  }

  const activePool = familyPools.find(p => p.id === activeFamilyPoolId) || familyPools[0];

  const familyExpenses = expenses.filter(e => e.category === 'Medical' && 'familyMember' in e);

  const calculateMemberSpend = (memberName: string) => {
    return familyExpenses
      .filter((e: any) => e.familyMember === memberName)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const totalAllocated = activePool?.members.reduce((sum, m) => sum + m.budget, 0) || 0;
  const totalSpent = activePool?.members.reduce((sum, m) => sum + calculateMemberSpend(m.name), 0) || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 pb-24 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6 mt-4">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Family Pools</h1>
      </div>

      {/* Pools Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-4 scrollbar-hide snap-x">
        {familyPools.map(pool => (
          <motion.div 
            key={pool.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFamilyPool(pool.id)}
            className={`min-w-[280px] p-6 rounded-3xl cursor-pointer snap-start transition-all border-2 backdrop-blur-md ${
              activeFamilyPoolId === pool.id 
                ? 'bg-white dark:bg-white/10 border-blue-500 dark:border-brand-neon shadow-sm dark:shadow-[0_0_20px_rgba(0,240,255,0.2)]' 
                : 'bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 opacity-90 dark:opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white dark:text-dark-bg font-black text-xl shadow-sm dark:shadow-[0_0_15px_currentColor]" style={{ backgroundColor: pool.color }}>
                {pool.name.charAt(0)}
              </div>
            </div>
            <h3 className={`text-xl font-bold mb-1 ${activeFamilyPoolId === pool.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-white/70'}`}>
              {pool.name}
            </h3>
            <p className={`font-black text-2xl ${activeFamilyPoolId === pool.id ? 'text-blue-600 dark:text-brand-neon drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' : 'text-gray-500 dark:text-white/50'}`}>
              ₹{pool.totalBudget.toLocaleString('en-IN')}
            </p>
          </motion.div>
        ))}
        
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreatePoolOpen(true)}
          className="min-w-[280px] p-6 rounded-3xl cursor-pointer snap-start border-2 border-dashed border-gray-300 dark:border-white/20 flex flex-col items-center justify-center text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/80 hover:border-gray-400 dark:hover:border-white/40 transition-colors backdrop-blur-md"
        >
          <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
          <span className="font-bold">New Family Pool</span>
        </motion.div>
      </div>

      {activePool ? (
        <>
          {/* Top Gradient Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total Pool Card */}
          <div className="rounded-[32px] p-8 text-white relative overflow-hidden shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/40 dark:border-white/10" style={{ backgroundImage: `linear-gradient(135deg, ${activePool.color}cc, ${activePool.color}88)` }}>
            <div className="absolute right-0 top-0 w-48 h-48 bg-white opacity-20 dark:opacity-10 rounded-full translate-x-12 -translate-y-12 blur-3xl" />
            <p className="text-white/90 dark:text-white/80 text-sm font-bold uppercase tracking-widest mb-2">{activePool.name} Pool</p>
            <div className="flex items-end gap-3 mb-6">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(activePool.totalBudget)}
              </h2>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-white/90 dark:text-white/80 border-t border-white/20 pt-4">
              <span>Allocated: ₹{totalAllocated.toLocaleString('en-IN')}</span>
              <span>Remaining: ₹{(activePool.totalBudget - totalAllocated).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Total Spent Card */}
          <div className="rounded-[32px] p-8 text-white relative overflow-hidden shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/40 dark:border-white/10 bg-gradient-to-br from-pink-500/80 to-purple-500/80 dark:from-brand-fuchsia/30 dark:to-brand-purple/30">
            <p className="text-white/90 dark:text-white/70 text-sm font-bold uppercase tracking-widest mb-2">Total Spent</p>
            <div className="flex items-end gap-3 mb-6">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalSpent)}
              </h2>
            </div>
            <div className="mt-4 bg-black/20 dark:bg-black/40 h-2 rounded-full overflow-hidden border border-white/20 dark:border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalSpent / activePool.totalBudget) * 100, 100)}%` }}
                className={`h-full rounded-full ${totalSpent > activePool.totalBudget ? 'bg-orange-400 dark:bg-brand-orange shadow-none dark:shadow-[0_0_10px_rgba(255,69,0,0.8)]' : 'bg-blue-400 dark:bg-brand-neon shadow-none dark:shadow-[0_0_10px_rgba(0,240,255,0.8)]'}`}
              />
            </div>
            <p className="text-xs text-white/80 dark:text-white/60 mt-3 font-bold">
              {((totalSpent / activePool.totalBudget) * 100).toFixed(1)}% of total pool utilized
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 mt-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Member Sub-Budgets</h2>
          <button 
            onClick={() => setIsAddMemberOpen(true)}
            className="text-sm font-bold text-blue-700 dark:text-brand-neon bg-blue-50 dark:bg-brand-neon/10 border border-blue-200 dark:border-brand-neon/20 px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-brand-neon/20 transition-colors active:scale-95 shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            + Add Member
          </button>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePool.members.map(member => {
            const memberSpent = calculateMemberSpend(member.name);
            const progress = Math.min((memberSpent / member.budget) * 100, 100);
            
            return (
              <div key={member.id} className="glass-card group hover:bg-white/80 dark:hover:bg-white/10 transition-all cursor-default">
                <div className="flex items-center gap-4 mb-6">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full border-2 border-gray-200 dark:border-white/20 shadow-md" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white flex items-center justify-center font-black text-xl border border-gray-200 dark:border-white/20">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{member.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-white/50 font-medium">{member.id}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">₹{memberSpent.toLocaleString('en-IN')}</span>
                      <span className="text-gray-500 dark:text-white/50 font-medium">/ ₹{member.budget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-black/30 rounded-full overflow-hidden border border-gray-300 dark:border-white/5">
                      <div 
                        className={`h-full rounded-full ${progress > 90 ? 'bg-orange-500 dark:bg-brand-orange shadow-none dark:shadow-[0_0_10px_rgba(255,69,0,0.8)]' : progress > 75 ? 'bg-yellow-400 dark:bg-yellow-500 shadow-none dark:shadow-[0_0_10px_rgba(234,179,8,0.8)]' : 'bg-blue-500 dark:bg-brand-neon shadow-none dark:shadow-[0_0_10px_rgba(0,240,255,0.8)]'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {progress > 90 && (
                    <p className="text-[10px] font-bold text-orange-700 dark:text-brand-orange bg-orange-50 dark:bg-brand-orange/20 border border-orange-200 dark:border-brand-orange/30 px-2 py-1 rounded-md inline-block">
                      Approaching Limit
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Add Member Placeholder Card */}
          <div 
            onClick={() => setIsAddMemberOpen(true)}
            className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-[32px] p-6 flex flex-col items-center justify-center text-gray-400 dark:text-white/40 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-white/40 hover:text-gray-600 dark:hover:text-white/80 transition-all active:scale-95 min-h-[220px] backdrop-blur-md"
          >
            <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-4 text-gray-500 dark:text-inherit">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <span className="font-bold">Add Family Member</span>
          </div>
        </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white/60 dark:bg-white/5 rounded-[32px] border border-gray-200 dark:border-white/10 mt-8 backdrop-blur-md shadow-xl">
          <p className="text-gray-500 dark:text-white/50 mb-6 font-medium text-lg">No family pools created yet.</p>
          <button 
            onClick={() => setIsCreatePoolOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white px-8 py-4 rounded-full font-bold shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all active:scale-95"
          >
            + Create First Pool
          </button>
        </div>
      )}

      <AddFamilyMemberModal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} />
      <CreateFamilyPoolModal isOpen={isCreatePoolOpen} onClose={() => setIsCreatePoolOpen(false)} />
    </motion.div>
  );
}
