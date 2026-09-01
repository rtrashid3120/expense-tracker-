import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { AppLogo } from '../components/AppLogo';

export function Onboarding() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Must start with @ or we prepend it
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      await updateProfile({ username: formattedUsername });
      window.location.reload(); // Reload to mount the rest of the app
    } catch (err: any) {
      setError(err.message || 'Username might already be taken!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-dark-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo size={52} showText={true} animated />
          </div>
          <p className="text-gray-500 dark:text-white/60 font-medium">Choose a unique username so your friends can find you.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-6 text-sm font-bold text-center border border-red-500/20 backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-white/80 mb-2 ml-1">Choose Username</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">@</span>
              <input
                type="text"
                value={username.replace('@', '')}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-brand-neon focus:border-transparent outline-none transition-all shadow-inner font-medium text-lg"
                placeholder="johndoe"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || username.length < 3}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white font-bold text-lg rounded-2xl px-4 py-4 shadow-[0_8px_20px_rgba(0,100,255,0.2)] dark:shadow-[0_8px_30px_rgba(0,240,255,0.3)] hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
