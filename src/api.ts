import type { Expense, Trip, Family, FamilyMember, Wallet } from './store';

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple mock backend using LocalStorage for persistence
export const api = {
  // User Budget
  getUserBudget: async (): Promise<number> => {
    await delay(200);
    const data = localStorage.getItem('user_budget_v2');
    return data ? parseFloat(data) : 50000; // default to 50k if not set
  },

  setUserBudget: async (budget: number): Promise<void> => {
    await delay(300);
    localStorage.setItem('user_budget_v2', budget.toString());
  },

  // Wallets
  getWallets: async (): Promise<Wallet[]> => {
    await delay(200);
    const data = localStorage.getItem('wallets_data_v2');
    return data ? JSON.parse(data) : [];
  },

  createWallet: async (name: string, initialBudget: number): Promise<Wallet> => {
    await delay(400);
    const newWallet: Wallet = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      initialBudget,
      balance: initialBudget,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
    };
    const current = await api.getWallets();
    const updated = [...current, newWallet];
    localStorage.setItem('wallets_data_v2', JSON.stringify(updated));
    return newWallet;
  },

  deleteWallet: async (id: string): Promise<void> => {
    await delay(400);
    const current = await api.getWallets();
    const updated = current.filter(w => w.id !== id);
    localStorage.setItem('wallets_data_v2', JSON.stringify(updated));
    
    // Also delete associated expenses
    const expenses = await api.getExpenses();
    const updatedExpenses = expenses.filter(e => e.walletId !== id);
    localStorage.setItem('expenses_data_v2', JSON.stringify(updatedExpenses));
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    await delay(300);
    const data = localStorage.getItem('expenses_data_v2');
    return data ? JSON.parse(data) : [];
  },
  
  addExpense: async (expense: Omit<Expense, 'id' | 'date'>): Promise<Expense> => {
    await delay(600);
    
    if (Math.random() < 0.1) {
      throw new Error('Network error: Failed to connect to server');
    }

    const newExpense: Expense = {
      ...expense,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split('T')[0],
    };

    const current = await api.getExpenses();
    const updated = [newExpense, ...current];
    localStorage.setItem('expenses_data_v2', JSON.stringify(updated));
    
    // Deduct from wallet if specified
    if (newExpense.walletId) {
      const wallets = await api.getWallets();
      const walletIndex = wallets.findIndex(w => w.id === newExpense.walletId);
      if (walletIndex !== -1) {
        wallets[walletIndex].balance -= newExpense.amount;
        localStorage.setItem('wallets_data_v2', JSON.stringify(wallets));
      }
    }
    
    // If it's a Trip expense, deduct from trip budget
    if (newExpense.category === 'Trip' && (newExpense as any).tripId) {
      const tripId = (newExpense as any).tripId;
      const trips = await api.getTrips();
      const tripIndex = trips.findIndex(t => t.id === tripId);
      if (tripIndex !== -1) {
        trips[tripIndex].spent += newExpense.amount;
        localStorage.setItem('trips_data_v2', JSON.stringify(trips));
      }
    }

    return newExpense;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await delay(400);
    const current = await api.getExpenses();
    const updated = current.filter(e => e.id !== id);
    localStorage.setItem('expenses_data_v2', JSON.stringify(updated));
  },

  // Trips
  getTrips: async (): Promise<Trip[]> => {
    await delay(300);
    const data = localStorage.getItem('trips_data_v2');
    return data ? JSON.parse(data) : [];
  },

  createTrip: async (tripData: Omit<Trip, 'id' | 'spent'>): Promise<Trip> => {
    await delay(800); // Simulate network
    
    const newTrip: Trip = {
      ...tripData,
      id: Math.random().toString(36).substring(2, 9),
      spent: 0
    };

    const current = await api.getTrips();
    const updated = [newTrip, ...current];
    localStorage.setItem('trips_data_v2', JSON.stringify(updated));
    return newTrip;
  },

  addMemberToTrip: async (tripId: string, member: { userId: string, balance: number }): Promise<Trip> => {
    await delay(500);
    const trips = await api.getTrips();
    const tripIndex = trips.findIndex(t => t.id === tripId);
    if (tripIndex === -1) throw new Error("Trip not found");
    
    const trip = trips[tripIndex];
    // Check if user already exists
    if (trip.balances.some(b => b.userId.toLowerCase() === member.userId.toLowerCase())) {
      throw new Error("User is already in this group");
    }

    const updatedTrip = {
      ...trip,
      groupSize: trip.groupSize + 1,
      balances: [...trip.balances, member]
    };

    trips[tripIndex] = updatedTrip;
    localStorage.setItem('trips_data_v2', JSON.stringify(trips));
    return updatedTrip;
  },

  // Family Pools
  getFamilyPools: async (): Promise<any[]> => {
    await delay(300);
    const data = localStorage.getItem('family_pools_data_v2');
    return data ? JSON.parse(data) : [];
  },

  createFamilyPool: async (name: string, totalBudget: number): Promise<any> => {
    await delay(400);
    const newPool = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      totalBudget,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
      members: []
    };
    const current = await api.getFamilyPools();
    const updated = [...current, newPool];
    localStorage.setItem('family_pools_data_v2', JSON.stringify(updated));
    return newPool;
  },

  addFamilyMember: async (poolId: string, member: FamilyMember): Promise<any> => {
    await delay(600);
    const pools = await api.getFamilyPools();
    const poolIndex = pools.findIndex(p => p.id === poolId);
    if (poolIndex === -1) throw new Error("Family pool not found");

    const pool = pools[poolIndex];
    const updatedPool = {
      ...pool,
      members: [...pool.members, member]
    };
    pools[poolIndex] = updatedPool;
    localStorage.setItem('family_pools_data_v2', JSON.stringify(pools));
    return updatedPool;
  },

  // Users Directory (Mocking real Supabase user search)
  searchUsers: async (query: string): Promise<{ id: string; name: string; avatar?: string }[]> => {
    await delay(400); // Simulate network
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
