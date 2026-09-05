import { Link, useLocation } from 'react-router-dom';
import { FiMap, FiPlus, FiHome, FiGrid, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  const location = useLocation();

  const navItems = [
    { id: '/', icon: FiHome, label: 'Home', type: 'link' },
    { id: '/heatmaps', icon: FiGrid, label: 'Heatmaps', type: 'link' },
    { id: 'add', isAdd: true, type: 'add' }, // Center + button
    { id: '/trips', icon: FiMap, label: 'Trips', type: 'link' },
    { id: '/profile', icon: FiUser, label: 'Profile', type: 'link' }
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md md:hidden z-50">
      <div className="bg-white/85 dark:bg-dark-surface/90 backdrop-blur-3xl border border-gray-200 dark:border-white/15 rounded-full flex justify-between items-center px-2 py-1.5 shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {navItems.map((item) => {
          if (item.type === 'add') {
            return (
              <motion.button
                key="add"
                onClick={onAddClick}
                title="Add Expense"
                whileTap={{ scale: 0.88 }}
                className="relative flex items-center justify-center w-14 h-14 flex-shrink-0 -mt-5"
              >
                {/* Organic radial glow — NOT a square blur box */}
                <motion.span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: '-8px',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(59,130,246,0.35) 45%, transparent 72%)',
                    filter: 'blur(8px)',
                  }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Second wider ambient ring */}
                <motion.span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: '-16px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 65%)',
                    filter: 'blur(14px)',
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.35, 0.65, 0.35] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
                {/* Main button circle */}
                <span className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 dark:from-cyan-400 dark:via-blue-500 dark:to-purple-600 shadow-[0_6px_24px_rgba(99,102,241,0.65)] dark:shadow-[0_6px_28px_rgba(0,210,255,0.6)] flex items-center justify-center">
                  <motion.span
                    whileTap={{ rotate: 90 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                    className="flex items-center justify-center"
                  >
                    <FiPlus size={23} className="text-white dark:text-black" strokeWidth={2.8} />
                  </motion.span>
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
