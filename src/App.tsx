import React, { useState, useEffect, Component } from 'react';
import type { ErrorInfo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from './pages/Dashboard';
import { Trips } from './pages/Trips';
import { Reports } from './pages/Reports';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { Family } from './pages/Family';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Onboarding } from './pages/Onboarding';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AIChatDrawer } from './components/AIChatDrawer';
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
  const { signOut, balance } = useAppStore();
  
  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex justify-between items-center px-4 py-3 bg-white/80 dark:bg-dark-surface/90 backdrop-blur-2xl border-b border-gray-200/60 dark:border-white/10 sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple flex items-center justify-center text-white font-black text-sm shadow-md">
              E
            </div>
            <span className="font-black text-base text-gray-900 dark:text-white tracking-tight">Expense<span className="text-gradient">Hub</span></span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
              ₹{balance.toLocaleString('en-IN')}
            </div>

            <button 
              onClick={signOut}
              title="Log Out"
              className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400"
            >
              <FiLogOut size={14} />
            </button>
          </div>
        </header>

        {/* Top Header for Desktop */}
        <header className="hidden md:flex justify-between items-center p-4 m-4 mb-0 glass-pill z-10 sticky top-4">
          <div className="relative w-96">
            <input type="text" placeholder="Search keyword..." className="w-full bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-full py-2.5 px-5 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-neon backdrop-blur-md transition-all shadow-inner" />
          </div>
          <div className="flex items-center gap-4">
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8 pt-3 md:pt-4">
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
  const { initAuth, user, isAuthLoading, isLoading, profile, joinTripViaLink } = useAppStore();
  const [pendingJoinTripId, setPendingJoinTripId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Check URL for ?joinTrip=id
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let tripId = searchParams.get('joinTrip');
    if (!tripId && window.location.hash.includes('joinTrip=')) {
      const hashQuery = window.location.hash.split('?')[1];
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        tripId = hashParams.get('joinTrip');
      }
    }
    if (tripId) {
      setPendingJoinTripId(tripId);
    }
  }, []);

  const handleAcceptJoin = async () => {
    if (!pendingJoinTripId) return;
    setIsJoining(true);
    setJoinError('');
    try {
      await joinTripViaLink(pendingJoinTripId);
      // Clean up URL search query
      const url = new URL(window.location.href);
      url.searchParams.delete('joinTrip');
      window.history.replaceState({}, '', url.pathname + url.hash);
      setPendingJoinTripId(null);
      window.location.hash = '#/trips';
    } catch (e: any) {
      setJoinError(e.message || 'Failed to join trip');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDismissJoin = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('joinTrip');
    window.history.replaceState({}, '', url.pathname + url.hash);
    setPendingJoinTripId(null);
  };

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

  // Force onboarding if profile is missing a username or has an auto-generated one
  if (!profile?.username || profile.username.startsWith('@user_')) {
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
                <Route path="/heatmaps" element={<PageTransition><Reports /></PageTransition>} />
                <Route path="/expenses" element={<PageTransition><AuditTrailPage /></PageTransition>} />
                <Route path="/trips" element={<PageTransition><Trips /></PageTransition>} />
                <Route path="/family" element={<PageTransition><Family /></PageTransition>} />
                <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Layout>
          <AddExpenseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
          <AIChatDrawer />
          
          {/* Join Trip Invitation Overlay */}
          {pendingJoinTripId && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="w-16 h-16 bg-brand-50 dark:bg-brand-neon/10 text-brand-600 dark:text-brand-neon rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                  ✈️
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Trip Invitation</h3>
                <p className="text-xs text-gray-500 dark:text-white/60 mb-6">
                  You've been invited via QR Code to join a trip group on ExpenseHub!
                </p>

                {joinError && (
                  <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl mb-4">
                    {joinError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleDismissJoin}
                    className="flex-1 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-xs font-bold text-gray-600 dark:text-white/70 hover:bg-gray-200"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptJoin}
                    disabled={isJoining}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    {isJoining ? 'Joining...' : 'Accept & Join'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </HashRouter>
    </ErrorBoundary>
  );
}
