import { Link, useLocation } from 'react-router-dom';
import { FiMap, FiPieChart, FiPlus, FiHome, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  const location = useLocation();

  const tabs = [
    { id: '/', icon: FiHome, label: 'Dashboard' },
    { id: '/expenses', icon: FiPieChart, label: 'Expenses' },
    { id: 'add', isAdd: true },
    { id: '/trips', icon: FiMap, label: 'Trips' },
    { id: '/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm md:hidden z-50">
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-3xl border border-gray-200 dark:border-white/20 rounded-full flex justify-between items-center p-2 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          if (tab.isAdd) {
            return (
              <motion.button
                whileTap={{ scale: 0.9 }}
                key="add"
                onClick={onAddClick}
                className="bg-gradient-to-tr from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white w-12 h-12 rounded-full shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 blur-md rounded-full" />
                <FiPlus size={24} className="relative z-10" />
              </motion.button>
            );
          }

          const isActive = location.pathname === tab.id;
          const Icon = tab.icon!;

          return (
            <Link
              key={tab.id}
              to={tab.id}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all relative ${
                isActive ? 'text-blue-700 dark:text-white' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/80'
              }`}
            >
              {isActive && (
                <motion.div layoutId="bottomnav-active" className="absolute inset-0 bg-blue-50 dark:bg-white/10 rounded-full border border-blue-100 dark:border-white/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)]" />
              )}
              <Icon size={20} className={`relative z-10 ${isActive ? 'text-blue-600 dark:text-brand-neon drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
