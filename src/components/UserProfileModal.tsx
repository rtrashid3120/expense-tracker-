import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiMail, FiHash, FiAtSign } from 'react-icons/fi';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id?: string;
    full_name?: string;
    username?: string;
    email?: string;
    avatar_url?: string;
    short_id?: string;
    [key: string]: any;
  } | null;
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  if (!user) return null;

  const displayName = user.full_name || user.username || user.name || 'Friend';
  const username = user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : `@${displayName.toLowerCase().replace(/\s+/g, '')}`;
  const email = user.email || `${username.replace(/^@/, '').toLowerCase()}@gmail.com`;
  const userIdCode = user.short_id || user.id?.substring(0, 7) || '7849201';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0f1423] border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 z-[151] shadow-2xl scrollbar-hide"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-white/50 uppercase tracking-widest">Friend Profile</h3>
              <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-neon to-brand-purple p-[3px] shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar_url || user.avatar ? (
                    <img src={user.avatar_url || user.avatar} className="w-full h-full object-cover" alt={displayName} />
                  ) : (
                    <FiUser size={40} className="text-brand-600 dark:text-brand-neon" />
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{displayName}</h2>
                <p className="text-brand-neon font-bold text-sm mt-0.5">{username}</p>
              </div>

              <div className="w-full space-y-3 pt-2">
                {/* Username Card */}
                <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-left">
                  <FiAtSign className="text-brand-purple dark:text-brand-neon shrink-0" size={18} />
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Username</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{username}</p>
                  </div>
                </div>

                {/* Email / Gmail Card */}
                <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-left">
                  <FiMail className="text-blue-500 shrink-0" size={18} />
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Gmail / Email</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{email}</p>
                  </div>
                </div>

                {/* User ID / Friend Code Card */}
                <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-left">
                  <FiHash className="text-emerald-500 shrink-0" size={18} />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">User ID / Friend Code</p>
                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-white tracking-widest">{userIdCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
