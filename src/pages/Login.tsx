import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Optional: show a message if email confirmation is required
        // alert("Check your email for the confirmation link!");
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/expense-tracker-/',
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google authentication');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-dark-bg">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-neon/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/20 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 md:p-12 relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-brand-neon to-brand-purple rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,240,255,0.4)]">
              <span className="text-3xl">💎</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">ExpenseHub</h1>
            <p className="text-gray-500 dark:text-white/60 font-medium">
              {isLogin ? 'Welcome back to your dashboard' : 'Create an account to get started'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-medium text-center backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-bold text-lg rounded-2xl px-4 py-4 mb-6 shadow-sm hover:shadow-md dark:hover:bg-white/10 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
            <span className="px-4 text-sm text-gray-400 dark:text-white/40 font-medium uppercase tracking-wider">Or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-white/80 mb-2 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-transparent transition-all shadow-inner"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-white/80 mb-2 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand-neon focus:border-transparent transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white font-bold text-lg rounded-2xl px-4 py-4 shadow-[0_8px_20px_rgba(0,100,255,0.2)] dark:shadow-[0_8px_30px_rgba(0,240,255,0.3)] hover:shadow-lg dark:hover:shadow-[0_8px_40px_rgba(0,240,255,0.5)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-500 dark:text-white/60 font-medium hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
