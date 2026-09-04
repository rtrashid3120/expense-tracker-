import { create } from 'zustand';
import { api } from './api';
import { supabase } from './lib/supabase';

export type Category = 'Groceries' | 'Transport' | 'Rent' | 'Dining' | 'Shopping' | 'Personal' | 'Medical' | 'Fuel' | 'Travel' | (string & {});

export interface BaseExpense {
  id: string;
  walletId?: string; // Optional for backward compatibility, but required for new expenses
  amount: number;
  category: Category;
  date: string;
  note?: string;
}

export interface GroceryExpense extends BaseExpense {
  category: 'Groceries';
  items?: { name: string; price: number; quantity: number }[];
}

export interface FuelExpense extends BaseExpense {
  category: 'Fuel';
  liters?: number;
  odometer?: number;
}

export interface MedicalExpense extends BaseExpense {
  category: 'Medical';
  familyMember?: string;
  insuranceClaimStatus?: 'Pending' | 'Approved' | 'Rejected' | 'N/A';
}

export interface TripExpense extends BaseExpense {
  category: 'Travel';
  tripId: string;
}

export type Expense = BaseExpense | GroceryExpense | FuelExpense | MedicalExpense | TripExpense;

export interface Trip {
  id: string;
  name: string;
  totalBudget: number;
  spent: number;
  groupSize: number;
  image: string;
  balances: { userId: string; balance: number }[];
}

export interface Wallet {
  id: string;
  name: string;
  initialBudget: number;
  balance: number;
  color: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  budget: number;
  spent: number;
  avatar?: string;
}

export interface FamilyPool {
  id: string;
  name: string;
  totalBudget: number;
  color: string;
  members: FamilyMember[];
}

interface AppState {
  user: any | null;
  isAuthLoading: boolean;
  expenses: Expense[];
  wallets: Wallet[];
  activeWalletId: string | null;
  trips: Trip[];
  familyPools: FamilyPool[];
  activeFamilyPoolId: string | null;
  balance: number;
  monthlyBudget: number;
  isLoading: boolean;
  error: string | null;
  profile: any | null;
  friends: any[];
  incomingRequests: any[];
  outgoingRequests: any[];
  
  // Actions
  initAuth: () => void;
  signOut: () => Promise<void>;
  fetchData: (silent?: boolean) => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  createTrip: (tripData: Omit<Trip, 'id' | 'spent'>) => Promise<void>;
  addMemberToTrip: (tripId: string, member: { userId: string, balance: number }) => Promise<void>;
  removeMemberFromTrip: (tripId: string, userId: string) => Promise<void>;
  joinTripViaLink: (tripId: string) => Promise<Trip>;
  createFamilyPool: (name: string, totalBudget: number) => Promise<void>;
  addFamilyMember: (poolId: string, member: FamilyMember) => Promise<void>;
  setActiveFamilyPool: (id: string) => void;
  setMonthlyBudget: (budget: number) => Promise<void>;
  createWallet: (name: string, initialBudget: number) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  setActiveWallet: (id: string) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthLoading: true,
  expenses: [],
  wallets: [],
  activeWalletId: null,
  trips: [],
  familyPools: [],
  activeFamilyPoolId: null,
  balance: 0,
  monthlyBudget: 50000,
  isLoading: true,
  error: null,
  profile: null,
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],

  initAuth: async () => {
    try {
      // 1. Check if user is logged into Supabase (Google Auth session)
      const { data: { session } } = await supabase.auth.getSession();
      let googleAvatar = localStorage.getItem('google_avatar_url') || '';
      let googleName = localStorage.getItem('google_full_name') || '';

      if (session?.user) {
        const email = session.user.email;
        const full_name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        const avatar_url = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '';
        
        if (avatar_url) {
          googleAvatar = avatar_url;
          localStorage.setItem('google_avatar_url', avatar_url);
        }
        if (full_name) {
          googleName = full_name;
          localStorage.setItem('google_full_name', full_name);
        }

        if (email) {
          try {
            await api.googleLogin(email, full_name, avatar_url);
          } catch (bridgeErr) {
            console.error('API Google bridge error:', bridgeErr);
          }
        }
      }

      // 2. Load standard MongoDB profile
      const profile = await api.getProfile();
      if (profile) {
        // If MongoDB profile doesn't have an avatar or it differs, sync Google photo
        if (googleAvatar && profile.avatar_url !== googleAvatar) {
          profile.avatar_url = googleAvatar;
          api.updateProfile({ avatar_url: googleAvatar }).catch(console.error);
        }
        if (googleName && (!profile.full_name || profile.full_name === 'ExpenseHub User' || profile.full_name === 'User')) {
          profile.full_name = googleName;
          api.updateProfile({ full_name: googleName }).catch(console.error);
        }
        set({ user: profile, profile, isAuthLoading: false });
        await get().fetchData();
      } else if (session?.user) {
        // Fallback profile from active Google session
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: googleName || session.user.email?.split('@')[0] || 'User',
          username: `@${session.user.email?.split('@')[0] || 'user'}`,
          avatar_url: googleAvatar,
          short_id: session.user.id.slice(0, 6)
        };
        set({ user: fallbackProfile as any, profile: fallbackProfile as any, isAuthLoading: false });
        await get().fetchData();
      } else {
        set({ user: null, profile: null, isAuthLoading: false, isLoading: false });
      }
    } catch (e) {
      set({ user: null, profile: null, isAuthLoading: false, isLoading: false });
    }
  },

  signOut: async () => {
    localStorage.removeItem('expensehub_token');
    localStorage.removeItem('google_avatar_url');
    localStorage.removeItem('google_full_name');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    set({ user: null, profile: null, expenses: [], wallets: [], trips: [], friends: [], isAuthLoading: false });
  },

  fetchData: async (silent = false) => {
    if (!silent && get().expenses.length === 0) {
      set({ isLoading: true, error: null });
    }
    try {
      const [expenses, trips, familyPools, monthlyBudget, wallets, profile, friendsData] = await Promise.all([
        api.getExpenses(),
        api.getTrips(),
        api.getFamilyPools(),
        api.getUserBudget(),
        api.getWallets(),
        api.getProfile(),
        api.getFriends()
      ]);
      
      const totalSpent = expenses.filter(e => !(e as any).tripId).reduce((sum, e) => sum + e.amount, 0);
      const balance = monthlyBudget - totalSpent;
      
      // Set active wallet to the first one if not set
      const activeWalletId = get().activeWalletId || (wallets.length > 0 ? wallets[0].id : null);
      const activeFamilyPoolId = get().activeFamilyPoolId || (familyPools.length > 0 ? familyPools[0].id : null);

      set({ 
        expenses, 
        trips, 
        familyPools, 
        activeFamilyPoolId, 
        monthlyBudget, 
        balance, 
        wallets, 
        activeWalletId,
        profile,
        friends: friendsData.friends,
        incomingRequests: friendsData.incomingRequests,
        outgoingRequests: friendsData.outgoingRequests,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load data', isLoading: false });
    }
  },

  updateProfile: async (updates: any) => {
    try {
      await api.updateProfile(updates);
      const profile = await api.getProfile();
      set({ profile });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update profile');
    }
  },

  sendFriendRequest: async (receiverId: string) => {
    try {
      await api.sendFriendRequest(receiverId);
      const friendsData = await api.getFriends();
      set({ 
        friends: friendsData.friends,
        incomingRequests: friendsData.incomingRequests,
        outgoingRequests: friendsData.outgoingRequests,
      });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send request');
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      const friendsData = await api.getFriends();
      set({ 
        friends: friendsData.friends,
        incomingRequests: friendsData.incomingRequests,
        outgoingRequests: friendsData.outgoingRequests,
      });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to accept request');
    }
  },

  setMonthlyBudget: async (budget) => {
    try {
      await api.setUserBudget(budget);
      set((state) => {
        const totalSpent = state.expenses.filter(e => !(e as any).tripId).reduce((sum, e) => sum + e.amount, 0);
        return {
          monthlyBudget: budget,
          balance: budget - totalSpent
        };
      });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to set budget');
    }
  },

  createTrip: async (tripData) => {
    try {
      const newTrip = await api.createTrip(tripData);
      set((state) => ({ trips: [newTrip, ...state.trips] }));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create group');
    }
  },

  addMemberToTrip: async (tripId, member) => {
    try {
      const updatedTrip = await api.addMemberToTrip(tripId, member);
      set((state) => ({
        trips: state.trips.map(t => t.id === tripId ? updatedTrip : t)
      }));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add member to trip');
    }
  },

  removeMemberFromTrip: async (tripId, userId) => {
    try {
      const updatedTrip = await api.removeMemberFromTrip(tripId, userId);
      set((state) => ({
        trips: state.trips.map(t => t.id === tripId ? updatedTrip : t)
      }));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to remove member from trip');
    }
  },

  joinTripViaLink: async (tripId) => {
    try {
      const updatedTrip = await api.joinTripViaLink(tripId);
      set((state) => {
        const exists = state.trips.some(t => t.id === updatedTrip.id);
        return {
          trips: exists
            ? state.trips.map(t => t.id === updatedTrip.id ? updatedTrip : t)
            : [updatedTrip, ...state.trips]
        };
      });
      return updatedTrip;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to join trip via link');
    }
  },

  createFamilyPool: async (name, totalBudget) => {
    try {
      const newPool = await api.createFamilyPool(name, totalBudget);
      set((state) => ({ 
        familyPools: [...state.familyPools, newPool],
        activeFamilyPoolId: state.activeFamilyPoolId || newPool.id
      }));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create family pool');
    }
  },

  addFamilyMember: async (poolId, member) => {
    try {
      const updatedPool = await api.addFamilyMember(poolId, member);
      set((state) => ({
        familyPools: state.familyPools.map(p => p.id === poolId ? updatedPool : p)
      }));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add family member');
    }
  },

  setActiveFamilyPool: (id) => set({ activeFamilyPoolId: id }),

  addExpense: async (expense) => {
    try {
      const newExpense = await api.addExpense(expense);
      
      set((state) => {
        const newExpenses = [newExpense, ...state.expenses];
        const totalSpent = newExpenses.filter(e => !(e as any).tripId).reduce((sum, e) => sum + e.amount, 0);
        
        let newWallets = state.wallets;
        if (newExpense.walletId) {
           newWallets = state.wallets.map(w => 
            w.id === newExpense.walletId ? { ...w, balance: w.balance - newExpense.amount } : w
          );
        }
        
        let newTrips = state.trips;
        const tId = (newExpense as any).tripId || (newExpense as any).details?.tripId;
        if (tId) {
          newTrips = state.trips.map(t => 
            t.id === tId ? { ...t, spent: t.spent + newExpense.amount } : t
          );
        }

        return { 
          expenses: newExpenses,
          wallets: newWallets,
          trips: newTrips,
          balance: state.monthlyBudget - totalSpent
        };
      });
    } catch (err: any) {
      // Re-throw to be handled by the UI component
      throw new Error(err.message || 'Failed to add expense');
    }
  },

  deleteExpense: async (id) => {
    try {
      await api.deleteExpense(id);
      
      set((state) => {
        const newExpenses = state.expenses.filter(e => e.id !== id);
        const totalSpent = newExpenses.filter(e => !(e as any).tripId).reduce((sum, e) => sum + e.amount, 0);
        
        // Also update the specific wallet balance
        const expense = state.expenses.find(e => e.id === id);
        let newWallets = state.wallets;
        if (expense?.walletId) {
           newWallets = state.wallets.map(w => 
            w.id === expense.walletId ? { ...w, balance: w.balance + expense.amount } : w
          );
        }

        return { 
          expenses: newExpenses,
          wallets: newWallets,
          balance: state.monthlyBudget - totalSpent
        };
      });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete expense');
    }
  },

  createWallet: async (name, initialBudget) => {
    try {
      const newWallet = await api.createWallet(name, initialBudget);
      set((state) => ({ 
        wallets: [...state.wallets, newWallet],
        activeWalletId: state.activeWalletId || newWallet.id 
      }));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create wallet');
    }
  },

  deleteWallet: async (id: string) => {
    try {
      await api.deleteWallet(id);
      set((state) => {
        const newWallets = state.wallets.filter(w => w.id !== id);
        const newExpenses = state.expenses.filter(e => e.walletId !== id);
        const totalSpent = newExpenses.filter(e => !(e as any).tripId).reduce((sum, e) => sum + e.amount, 0);
        
        return {
          wallets: newWallets,
          expenses: newExpenses,
          activeWalletId: newWallets.length > 0 ? newWallets[0].id : null,
          balance: state.monthlyBudget - totalSpent
        };
      });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete wallet');
    }
  },

  setActiveWallet: (id) => set({ activeWalletId: id }),

  clearError: () => set({ error: null })
}));
