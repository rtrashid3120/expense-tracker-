import { Link, useLocation } from 'react-router-dom';
import { FiUsers, FiMap, FiGrid, FiFileText, FiUser, FiHome, FiCpu } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/heatmaps', label: 'Heatmaps', icon: FiGrid },
    { path: '/expenses', label: 'Audit Trail', icon: FiFileText },
    { path: '/trips', label: 'Trips & Groups', icon: FiMap },
    { path: '/profile', label: 'Profile', icon: FiUser },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 floating-element glass-card h-[calc(100vh-2rem)] p-6 relative z-10">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          E
        </div>
        <span className="font-black text-2xl tracking-tight text-gray-900 dark:text-white">Expense<span className="text-gradient">Hub</span></span>
      </div>

      <div className="mb-8">
        <div className="mt-auto p-4 bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl mb-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?u=rashid" alt="User" className="w-10 h-10 rounded-full border-2 border-blue-500 dark:border-brand-neon shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Mohamed</p>
              <p className="text-xs text-gray-500 dark:text-white/60 font-medium">@rashid_dev</p>
            </div>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-400 mb-4 px-3 tracking-wider uppercase">Main Menu</p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-blue-50/50 dark:bg-brand-neon/10 text-blue-700 dark:text-brand-neon font-bold border border-blue-200/50 dark:border-brand-neon/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]' 
                    : 'text-gray-500 dark:text-white/60 hover:bg-gray-100/50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white font-medium'
                }`}
              >
                <item.icon size={22} className={isActive ? 'text-blue-600 dark:text-brand-neon' : ''} />
                {item.label}
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute right-2 w-1.5 h-6 bg-blue-600 dark:bg-brand-neon rounded-full shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-1">
        <p className="text-xs font-bold text-gray-400 mb-4 px-3 tracking-wider uppercase">Other</p>
        <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors">
          <FiSettings size={20} className="text-gray-400" />
          Settings
        </Link>
      </div>
    </div>
  );
}
