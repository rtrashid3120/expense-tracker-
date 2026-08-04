import { Link, useLocation } from 'react-router-dom';
import { FiMap, FiFileText, FiPlus, FiHome, FiUser, FiCpu } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  const location = useLocation();

  const handleOpenAI = () => {
    window.dispatchEvent(new Event('open-ai-chat'));
  };

  const navItems = [
    { id: '/', icon: FiHome, label: 'Home', type: 'link' },
    { id: '/trips', icon: FiMap, label: 'Trips', type: 'link' },
    { id: '/expenses', icon: FiFileText, label: 'Audit Trail', type: 'link' }, // Immediately left of +
    { id: 'add', isAdd: true, type: 'add' },
    { id: '/profile', icon: FiUser, label: 'Profile', type: 'link' },
    { id: 'ai', icon: FiCpu, label: 'AI Bot', type: 'ai', onClick: handleOpenAI } // Right end
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md md:hidden z-50">
      <div className="bg-white/85 dark:bg-dark-surface/90 backdrop-blur-3xl border border-gray-200 dark:border-white/15 rounded-full flex justify-between items-center px-2 py-1.5 shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {navItems.map((item) => {
          if (item.type === 'add') {
            return (
              <motion.button
                whileTap={{ scale: 0.9 }}
                key="add"
                onClick={onAddClick}
                title="Add Expense"
                className="bg-gradient-to-tr from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg dark:shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center justify-center relative overflow-hidden flex-shrink-0"
              >
                <div className="absolute inset-0 bg-white/20 blur-md rounded-full" />
                <FiPlus size={22} className="relative z-10" />
              </motion.button>
            );
          }

          if (item.type === 'ai') {
            const Icon = item.icon!;
            return (
              <motion.button
                whileTap={{ scale: 0.9 }}
                key="ai"
                onClick={item.onClick}
                title="ExpenseHub AI"
                className="relative flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-purple-600 dark:text-brand-neon bg-purple-50 dark:bg-brand-neon/10 border border-purple-200 dark:border-brand-neon/30 transition-all hover:scale-105 shadow-sm"
              >
                <Icon size={18} className="relative z-10 animate-pulse" />
                <span className="absolute -top-1 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 dark:bg-brand-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600 dark:bg-brand-neon"></span>
                </span>
              </motion.button>
            );
          }

          const isActive = location.pathname === item.id;
          const Icon = item.icon!;

          return (
            <Link
              key={item.id}
              to={item.id}
              title={item.label}
              className={`flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all relative ${
                isActive ? 'text-blue-700 dark:text-white' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/80'
              }`}
            >
              {isActive && (
                <motion.div layoutId="bottomnav-active" className="absolute inset-0 bg-blue-50 dark:bg-white/10 rounded-full border border-blue-100 dark:border-white/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)]" />
              )}
              <Icon size={19} className={`relative z-10 ${isActive ? 'text-blue-600 dark:text-brand-neon drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
