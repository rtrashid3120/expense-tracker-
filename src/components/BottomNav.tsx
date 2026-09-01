import { Link, useLocation } from 'react-router-dom';
import { FiMap, FiFileText, FiPlus, FiHome, FiCpu, FiGrid, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  const location = useLocation();

  const handleOpenAI = () => {
    window.dispatchEvent(new Event('open-ai-chat'));
  };

  const navItems = [
    { id: '/', icon: FiHome, label: 'Home', type: 'link' },
    { id: '/heatmaps', icon: FiGrid, label: 'Heatmaps', type: 'link' },
    { id: '/expenses', icon: FiFileText, label: 'Audit', type: 'link' },
    { id: 'add', isAdd: true, type: 'add' },
    { id: '/trips', icon: FiMap, label: 'Trips', type: 'link' },
    { id: 'ai', icon: FiCpu, label: 'AI Bot', type: 'ai', onClick: handleOpenAI },
    { id: '/profile', icon: FiUser, label: 'Profile', type: 'link' }
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[96%] max-w-lg md:hidden z-50">
      <div className="bg-slate-950/90 dark:bg-black/95 backdrop-blur-2xl border border-white/10 rounded-full flex justify-between items-center px-3 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.8)] relative overflow-visible">
        {navItems.map((item) => {
          if (item.type === 'add') {
            return (
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.08 }}
                key="add"
                onClick={onAddClick}
                title="Add Expense"
                className="bg-gradient-to-tr from-red-600 via-rose-500 to-red-500 dark:from-brand-neon dark:to-brand-purple text-white dark:text-black w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)] dark:shadow-[0_0_20px_rgba(0,240,255,0.6)] flex items-center justify-center relative overflow-hidden flex-shrink-0 cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/20 blur-md rounded-full" />
                <FiPlus size={22} className="relative z-10 font-bold" />
              </motion.button>
            );
          }

          if (item.type === 'ai') {
            const Icon = item.icon!;
            return (
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.08 }}
                key="ai"
                onClick={item.onClick}
                title="ExpenseHub AI"
                className="relative flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-red-400 dark:text-brand-neon bg-red-950/40 dark:bg-brand-neon/10 border border-red-500/30 dark:border-brand-neon/30 transition-all shadow-sm cursor-pointer"
              >
                <Icon size={18} className="relative z-10 animate-pulse" />
                <span className="absolute -top-1 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 dark:bg-brand-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 dark:bg-brand-neon"></span>
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
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-full transition-all relative z-10 min-w-[44px] ${
                isActive ? 'text-red-500 dark:text-brand-neon font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {/* Animated Curved Bell-Curve Dome Wave matching reference image */}
              {isActive && (
                <motion.div
                  layoutId="active-wave-dome"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                >
                  {/* Curved Dome Arc SVG */}
                  <svg
                    className="absolute -top-2.5 w-14 h-12 text-red-500 dark:text-brand-neon overflow-visible"
                    viewBox="0 0 56 48"
                    fill="none"
                  >
                    <path
                      d="M -6,44 C 10,44 14,8 28,8 C 42,8 46,44 62,44"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                      className="drop-shadow-[0_0_10px_rgba(239,68,68,0.9)] dark:drop-shadow-[0_0_10px_rgba(0,240,255,0.9)]"
                    />
                  </svg>
                  {/* Active background highlight glow */}
                  <div className="absolute inset-0 bg-red-500/10 dark:bg-brand-neon/10 rounded-full blur-md" />
                </motion.div>
              )}

              {/* Icon */}
              <motion.div
                animate={isActive ? { y: -2, scale: 1.15 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative z-20"
              >
                <Icon size={19} className={isActive ? 'text-red-500 dark:text-brand-neon drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''} />
              </motion.div>

              {/* Glowing active indicator dot */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-brand-neon mt-0.5 relative z-20 shadow-[0_0_8px_rgba(239,68,68,1)] dark:shadow-[0_0_8px_rgba(0,240,255,1)]"
                />
              )}

              {/* Label */}
              <span className={`text-[10px] tracking-tight mt-0.5 relative z-20 ${isActive ? 'font-bold text-red-500 dark:text-brand-neon' : 'text-gray-400 font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Continuous bottom accent line */}
        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-red-500/30 dark:bg-brand-neon/20 rounded-full pointer-events-none" />
      </div>
    </div>
  );
}
