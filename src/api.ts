import type { Expense, Trip, FamilyMember, Wallet } from './store';

const API_BASE_URL = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('expensehub_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // User Auth & Profile
  login: async (email: string, password: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token) localStorage.setItem('expensehub_token', data.token);
    return data.user;
  },

  signup: async (email: string, password: string, username?: string, full_name?: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, full_name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    if (data.token) localStorage.setItem('expensehub_token', data.token);
    return data.user;
  },

  googleLogin: async (email: string, full_name?: string, avatar_url?: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name, avatar_url })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google Login failed');
    if (data.token) localStorage.setItem('expensehub_token', data.token);
    return data.user;
  },

  getProfile: async (): Promise<any> => {
    const token = localStorage.getItem('expensehub_token');
    if (!token) return null;

    const res = await fetch(`${API_BASE_URL}/profile`, { headers: getHeaders() });
    if (!res.ok) return null;
    return await res.json();
  },

  updateProfile: async (updates: any): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  // Search Users Directory
  searchUsers: async (query: string): Promise<any[]> => {
    if (!query || query.length < 2) return [];
    const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  // User Budget
  getUserBudget: async (): Promise<number> => {
    const wallets = await api.getWallets();
    if (wallets.length > 0) return wallets[0].initialBudget;
    return 50000;
  },

  setUserBudget: async (_budget: number): Promise<void> => {
    // Budget maintained in wallets
  },

  // Wallets
  getWallets: async (): Promise<Wallet[]> => {
    const res = await fetch(`${API_BASE_URL}/wallets`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  createWallet: async (name: string, initialBudget: number): Promise<Wallet> => {
    const res = await fetch(`${API_BASE_URL}/wallets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, initialBudget })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create wallet');
    return data;
  },

  deleteWallet: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/wallets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete wallet');
    }
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    const res = await fetch(`${API_BASE_URL}/expenses`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  addExpense: async (expense: Omit<Expense, 'id' | 'date'>): Promise<Expense> => {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(expense)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add expense');
    return data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete expense');
    }
  },

  // Trips
  getTrips: async (): Promise<Trip[]> => {
    const res = await fetch(`${API_BASE_URL}/trips`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  createTrip: async (tripData: Omit<Trip, 'id' | 'spent'>): Promise<Trip> => {
    const res = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(tripData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create trip');
    return data;
  },

  addMemberToTrip: async (tripId: string, member: { userId: string, balance: number }): Promise<Trip> => {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ member })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add member to trip');
    return data;
  },

  removeMemberFromTrip: async (tripId: string, userId: string): Promise<Trip> => {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove member from trip');
    return data;
  },

  // Family Pools
  getFamilyPools: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/family-pools`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  createFamilyPool: async (name: string, totalBudget: number): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/family-pools`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, totalBudget })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create family pool');
    return data;
  },

  addFamilyMember: async (_poolId: string, _member: FamilyMember): Promise<any> => {
    return { success: true };
  },

  // Friends
  getFriends: async (): Promise<{ friends: any[], incomingRequests: any[], outgoingRequests: any[] }> => {
    const res = await fetch(`${API_BASE_URL}/friends`, { headers: getHeaders() });
    if (!res.ok) return { friends: [], incomingRequests: [], outgoingRequests: [] };
    return await res.json();
  },

  sendFriendRequest: async (receiverId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/friends/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ receiverId })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send friend request');
    }
  },

  acceptFriendRequest: async (requestId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/friends/accept`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ requestId })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to accept friend request');
    }
  }
};
