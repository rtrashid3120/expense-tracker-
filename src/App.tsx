import React, { useState, useEffect, Component } from 'react';
import type { ErrorInfo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from './pages/Dashboard';
import { Trips } from './pages/Trips';
import { Reports } from './pages/Reports';
import { Family } from './pages/Family';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Onboarding } from './pages/Onboarding';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { AddExpenseModal } from './components/AddExpenseModal';
import { useAppStore } from './store';
import { FiLogOut } from 'react-icons/fi';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500 bg-red-50 h-screen w-full flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-white p-4 rounded shadow max-w-2xl overflow-auto text-sm">{this.state.error?.toString()}</pre>
          <pre className="bg-white p-4 rounded shadow max-w-2xl overflow-auto text-xs mt-4">{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()} className="mt-6 bg-red-500 text-white px-4 py-2 rounded">Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Layout({ children, onAddClick }: { children: React.ReactNode; onAddClick: () => void }) {
  const { signOut } = useAppStore();
  const location = useLocation();
  
  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Header for Desktop */}
        <header className="hidden md:flex justify-between items-center p-4 m-4 mb-0 glass-pill z-10 sticky top-4">
          <div className="relative w-96">
            <input type="text" placeholder="Search keyword..." className="w-full bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-full py-2.5 px-5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-neon backdrop-blur-md transition-all shadow-inner" />
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-white/80 hover:text-brand-neon hover:bg-white/40 transition-all shadow-sm">
              🔔
            </button>
            <button 
              onClick={signOut}
              title="Log Out"
              className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all shadow-sm"
            >
              <FiLogOut size={18} />
            </button>
            <button onClick={onAddClick} className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] active:scale-95 transition-all">
              + New Expense
            </button>
          </div>
        </header>

        {/* Mobile Logout Button (Floating) - Only on home page */}
        {location.pathname === '/' && (
          <button 
            onClick={signOut}
            className="md:hidden absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all shadow-sm"
            title="Log Out"
          >
            <FiLogOut size={18} />
          </button>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 pt-16 md:pt-4">
          {children}
        </main>
        
        <BottomNav onAddClick={onAddClick} />
      </div>
    </div>
  );
}

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="h-full"
  >
    {children}
  </motion.div>
);

export default function App() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { initAuth, user, isAuthLoading, isLoading, profile } = useAppStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isAuthLoading || (user && isLoading)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-white/10 border-t-brand-neon rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple">
          {isAuthLoading ? 'Authenticating...' : 'Loading ExpenseHub...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Force onboarding if profile is missing a username
  if (!profile?.username) {
    return <Onboarding />;
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <AnimatePresence>
          <Layout onAddClick={() => setIsAddOpen(true)}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
                <Route path="/trips" element={<PageTransition><Trips /></PageTransition>} />
                <Route path="/expenses" element={<PageTransition><Reports /></PageTransition>} />
                <Route path="/family" element={<PageTransition><Family /></PageTransition>} />
                <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Layout>
          <AddExpenseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
        </AnimatePresence>
      </HashRouter>
    </ErrorBoundary>
  );
}
