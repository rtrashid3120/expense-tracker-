import { Link, useLocation } from 'react-router-dom';
import { FiGrid, FiUsers, FiMap, FiPieChart, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: FiGrid },
    { path: '/expenses', label: 'Expenses', icon: FiPieChart },
    { path: '/trips', label: 'Trips & Groups', icon: FiMap },
    { path: '/family', label: 'Family', icon: FiUsers },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white/5 backdrop-blur-3xl border-r border-white/10 h-screen p-6 relative z-10">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-gradient-to-br from-brand-neon to-brand-purple rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          E
        </div>
        <span className="font-black text-2xl tracking-tight text-white">Expense<span className="text-gradient">Hub</span></span>
      </div>

      <div className="mb-8">
        <div className="mt-auto p-4 bg-white/5 border border-white/10 rounded-2xl mb-6">
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?u=rashid" alt="User" className="w-10 h-10 rounded-full border-2 border-brand-neon shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
            <div>
              <p className="text-sm font-bold text-white">Mohamed</p>
              <p className="text-xs text-white/60 font-medium">@rashid_dev</p>
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
                    ? 'bg-white/10 text-white font-bold border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white font-medium'
                }`}
              >
                <item.icon size={22} className={isActive ? 'text-brand-neon' : ''} />
                {item.label}
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute right-2 w-1.5 h-6 bg-brand-neon rounded-full shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
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
