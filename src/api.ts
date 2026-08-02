import { supabase } from './lib/supabase';
import type { Expense, Trip, FamilyMember, Wallet } from './store';

export const api = {
  // User Budget
  getUserBudget: async (): Promise<number> => {
    const { data, error } = await supabase.from('user_settings').select('budget').limit(1).single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
      console.error('Error fetching budget:', error);
    }
    return data?.budget || 50000;
  },

  setUserBudget: async (budget: number): Promise<void> => {
    // Upsert budget. We assume a single user settings row for now
    const { data } = await supabase.from('user_settings').select('id').limit(1).single();
    
    if (data) {
      await supabase.from('user_settings').update({ budget }).eq('id', data.id);
    } else {
      await supabase.from('user_settings').insert({ budget });
    }
  },

  // Wallets
  getWallets: async (): Promise<Wallet[]> => {
    const { data, error } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    
    return data.map(w => ({
      id: w.id,
      name: w.name,
      initialBudget: Number(w.initial_budget),
      balance: Number(w.balance),
      color: w.color
    }));
  },

  createWallet: async (name: string, initialBudget: number): Promise<Wallet> => {
    const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    const { data, error } = await supabase.from('wallets').insert({
      name,
      initial_budget: initialBudget,
      balance: initialBudget,
      color
    }).select().single();
    
    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      initialBudget: Number(data.initial_budget),
      balance: Number(data.balance),
      color: data.color
    };
  },

  deleteWallet: async (id: string): Promise<void> => {
    const { error } = await supabase.from('wallets').delete().eq('id', id);
    if (error) throw error;
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    return data.map(e => {
      let base = {
        id: e.id,
        walletId: e.wallet_id || undefined,
        amount: Number(e.amount),
        category: e.category,
        date: e.date,
        note: e.note || undefined,
      };

      if (e.details) {
        base = { ...base, ...e.details };
      }
      
      return base as Expense;
    });
  },
  
  addExpense: async (expense: Omit<Expense, 'id' | 'date'>): Promise<Expense> => {
    // Extract base fields
    const { amount, category, note, walletId, ...details } = expense as any;
    const date = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.from('expenses').insert({
      wallet_id: walletId || null,
      amount,
      category,
      date,
      note,
      details: Object.keys(details).length > 0 ? details : null
    }).select().single();

    if (error) throw error;

    // Deduct from wallet if specified
    if (walletId) {
      const wallets = await api.getWallets();
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        await supabase.from('wallets').update({ balance: wallet.balance - amount }).eq('id', walletId);
      }
    }
    
    // If it's a Trip expense, deduct from trip budget
    if (category === 'Travel' && details.tripId) {
      const trips = await api.getTrips();
      const trip = trips.find(t => t.id === details.tripId);
      if (trip) {
        await supabase.from('trips').update({ spent: trip.spent + amount }).eq('id', details.tripId);
      }
    }

    let returnExp = {
      id: data.id,
      walletId: data.wallet_id || undefined,
      amount: Number(data.amount),
      category: data.category,
      date: data.date,
      note: data.note || undefined,
    };
    if (data.details) returnExp = { ...returnExp, ...data.details };
    return returnExp as Expense;
  },

  deleteExpense: async (id: string): Promise<void> => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },

  // Trips
  getTrips: async (): Promise<Trip[]> => {
    const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    return data.map(t => ({
      id: t.id,
      name: t.name,
      totalBudget: Number(t.total_budget),
      spent: Number(t.spent),
      groupSize: t.group_size,
      image: t.image,
      balances: t.balances || []
    }));
  },

  createTrip: async (tripData: Omit<Trip, 'id' | 'spent'>): Promise<Trip> => {
    const { data, error } = await supabase.from('trips').insert({
      name: tripData.name,
      total_budget: tripData.totalBudget,
      group_size: tripData.groupSize,
      image: tripData.image,
      balances: tripData.balances
    }).select().single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      totalBudget: Number(data.total_budget),
      spent: Number(data.spent),
      groupSize: data.group_size,
      image: data.image,
      balances: data.balances || []
    };
  },

  addMemberToTrip: async (tripId: string, member: { userId: string, balance: number }): Promise<Trip> => {
    const trips = await api.getTrips();
    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    
    if (trip.balances.some(b => b.userId.toLowerCase() === member.userId.toLowerCase())) {
      throw new Error("User is already in this group");
    }

    const newBalances = [...trip.balances, member];
    const newSize = trip.groupSize + 1;

    const { data, error } = await supabase.from('trips').update({
      balances: newBalances,
      group_size: newSize
    }).eq('id', tripId).select().single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      totalBudget: Number(data.total_budget),
      spent: Number(data.spent),
      groupSize: data.group_size,
      image: data.image,
      balances: data.balances || []
    };
  },

  // Family Pools
  getFamilyPools: async (): Promise<any[]> => {
    const { data, error } = await supabase.from('family_pools').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    return data.map(p => ({
      id: p.id,
      name: p.name,
      totalBudget: Number(p.total_budget),
      color: p.color,
      members: p.members || []
    }));
  },

  createFamilyPool: async (name: string, totalBudget: number): Promise<any> => {
    const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    const { data, error } = await supabase.from('family_pools').insert({
      name,
      total_budget: totalBudget,
      color,
      members: []
    }).select().single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      totalBudget: Number(data.total_budget),
      color: data.color,
      members: data.members || []
    };
  },

  addFamilyMember: async (poolId: string, member: FamilyMember): Promise<any> => {
    const pools = await api.getFamilyPools();
    const pool = pools.find(p => p.id === poolId);
    if (!pool) throw new Error("Family pool not found");

    const newMembers = [...pool.members, member];

    const { data, error } = await supabase.from('family_pools').update({
      members: newMembers
    }).eq('id', poolId).select().single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      totalBudget: Number(data.total_budget),
      color: data.color,
      members: data.members || []
    };
  },

  // Users Directory (Mocking real Supabase user search)
  searchUsers: async (query: string): Promise<{ id: string; name: string; avatar?: string }[]> => {
    const mockDirectory = [
      { id: '@rahul_99', name: 'Rahul Sharma', avatar: 'https://i.pravatar.cc/150?u=rahul' },
      { id: '@priya_desai', name: 'Priya Desai', avatar: 'https://i.pravatar.cc/150?u=priya' },
      { id: '@amit_k', name: 'Amit Kumar', avatar: 'https://i.pravatar.cc/150?u=amit' },
      { id: '@neha_s', name: 'Neha Singh', avatar: 'https://i.pravatar.cc/150?u=neha' },
      { id: '@rashid_dev', name: 'Mohamed Rashid', avatar: 'https://i.pravatar.cc/150?u=rashid' },
      { id: '@elanoire', name: 'Elanoire Maggie', avatar: 'https://i.pravatar.cc/150?u=elanoire' },
    ];

    const q = query.toLowerCase();
    return mockDirectory.filter(
      u => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
    );
  }
};
