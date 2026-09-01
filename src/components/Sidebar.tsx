import { Link, useLocation } from 'react-router-dom';
import { FiMap, FiGrid, FiFileText, FiUser, FiHome, FiSettings, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { AppLogo } from './AppLogo';
import { useAppStore } from '../store';

export function Sidebar() {
  const location = useLocation();
  const profile = useAppStore(state => state.profile);
  const user = useAppStore(state => state.user);
  
  const fullName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'User';
  const username = profile?.username || user?.username || (user?.email ? `@${user.email.split('@')[0]}` : '@username');
  const avatarUrl = profile?.avatar_url || user?.avatar_url || profile?.avatar || user?.avatar || '/profile-avatar.svg';

  const handleOpenAI = () => {
    window.dispatchEvent(new Event('open-ai-chat'));
  };

  const navItems = [
    { type: 'link', path: '/', label: 'Dashboard', icon: FiHome },
    { type: 'link', path: '/heatmaps', label: 'Heatmaps', icon: FiGrid },
    { type: 'link', path: '/expenses', label: 'Audit Trail', icon: FiFileText },
    { type: 'link', path: '/trips', label: 'Trips & Groups', icon: FiMap },
    { type: 'action', onClick: handleOpenAI, label: 'ExpenseHub AI', icon: FiZap },
    { type: 'link', path: '/profile', label: 'Profile', icon: FiUser },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 floating-element glass-card h-[calc(100vh-2rem)] p-6 relative z-10">
      <div className="flex items-center mb-8">
        <AppLogo size={42} showText={true} animated />
      </div>

      <div className="mb-8">
        <Link to="/profile" className="block mt-auto p-3.5 bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl mb-6 shadow-sm dark:shadow-none hover:bg-white/80 dark:hover:bg-white/10 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-neon to-brand-purple p-[2px] shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.4)] shrink-0 overflow-hidden">
              <img 
                src={avatarUrl} 
                alt={fullName} 
                className="w-full h-full rounded-full object-cover bg-[#091326]" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/profile-avatar.svg';
                }}
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{fullName}</p>
              <p className="text-xs text-blue-600 dark:text-brand-neon font-bold truncate">{username}</p>
            </div>
          </div>
        </Link>

        <p className="text-xs font-bold text-gray-400 mb-4 px-3 tracking-wider uppercase">Main Menu</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            if (item.type === 'action') {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-500 dark:text-white/60 hover:bg-gray-100/50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white font-medium transition-all text-left cursor-pointer"
                >
                  <item.icon size={22} />
                  <span>{item.label}</span>
                </button>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path || item.label}
                to={item.path || '/'}
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
