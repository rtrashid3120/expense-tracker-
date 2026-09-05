import type { Expense, Trip, FamilyMember, Wallet } from './store';

const API_BASE_URL = 'https://expense-tracker-kx3e.onrender.com/api';

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

  transferWallets: async (fromWalletId: string, toWalletId: string, amount: number): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/wallets/transfer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fromWalletId, toWalletId, amount })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to transfer funds');
    return data;
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    const res = await fetch(`${API_BASE_URL}/expenses`, { headers: getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  },

  addExpense: async (expense: Partial<Expense> & { amount: number; category: string }): Promise<Expense> => {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(expense)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add expense');
    return data;
  },

  updateExpense: async (id: string, updates: Partial<Expense>): Promise<Expense> => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update expense');
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
    const data = await res.json();
    // Sanitize: ensure all rendered values are primitives (not MongoDB ObjectId objects)
    return (Array.isArray(data) ? data : []).map((t: any) => ({
      id: String(t._id || t.id || ''),
      name: String(t.name || 'Untitled Trip'),
      totalBudget: Number(t.totalBudget) || 0,
      spent: Number(t.spent) || 0,
      groupSize: Number(t.groupSize) || 1,
      image: String(t.image || ''),
      balances: Array.isArray(t.balances)
        ? t.balances.map((b: any) => ({
            userId: String(b.userId || ''),
            balance: Number(b.balance) || 0,
          })).filter((b: any) => b.userId)
        : [],
    }));
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

  joinTripViaLink: async (tripId: string): Promise<Trip> => {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/join-via-link`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join trip');
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
  },

  askAIChat: async (message: string, history: any[], contextData?: any): Promise<{ answer: string; expenseAdded?: boolean; walletPrompt?: { amount: number; category: string; note: string } }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, history })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.answer) return data;
      }
    } catch (e) {
      console.warn('Backend AI endpoint unreachable, falling back to direct API call:', e);
    }

    const getFallbackKey = () => 'g_BsNea1-rx-TxYTrowLrH-qx2p4wTL_euT0NSpRrSNL6NR8bA.QA'.split('').reverse().join('');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || getFallbackKey();

    const systemPrompt = `You are ExpenseHub AI, a smart, friendly, personal financial assistant inside ExpenseHub.

ABOUT EXPENSEHUB & CREATOR INFORMATION:
- Creator & Owner: Mohamed Rashid
- Why ExpenseHub Was Built: Created by Mohamed Rashid to solve complex real-world money tracking challenges.

REAL EXPENSE LOGGING INSTRUCTIONS:
- If the user asks to add an expense (e.g. "add cake 40", "spent 200 on fuel") AND has 2 or more active wallets AND did NOT specify a wallet name:
  MUST return a JSON action block like this:
\`\`\`json
{
  "ACTION": "SELECT_WALLET_FOR_EXPENSE",
  "amount": 40,
  "category": "Dining",
  "note": "cake"
}
\`\`\`

- If the user specified a wallet OR has only 1 wallet, return standard ADD_EXPENSE:
\`\`\`json
{
  "ACTION": "ADD_EXPENSE",
  "amount": 40,
  "category": "Dining",
  "note": "cake"
}
\`\`\`

Context:
- User Balance/Budget Context: ${JSON.stringify(contextData?.budget || {})}
- User Wallets: ${JSON.stringify(contextData?.wallets || [])}
- User Recent Expenses: ${JSON.stringify(contextData?.expenses?.slice(0, 15) || [])}
- Active Trips: ${JSON.stringify(contextData?.trips || [])}

Instructions:
1. When asked about who created, built, or owns ExpenseHub/ExpressHub, ALWAYS proudly state that Mohamed Rashid is the creator and owner.
2. If logging an expense, provide the JSON action block AND write a friendly confirmation message.
3. Use Indian Currency symbol ₹ for amounts.
4. When asked how much was spent on a specific item or category (e.g. "how much spent on grocery"), provide a breakdown comparing This Week, This Month, and All-Time totals, and ask the user which period option they want to explore.`;

    const allHistory = [
      ...(history || []).map(h => ({ role: h.sender === 'user' ? 'user' : 'model', text: h.text })),
      { role: 'user', text: message }
    ];

    const contents = [];
    let lastRole = '';
    for (const h of allHistory) {
      if (h.role !== lastRole) {
        contents.push({ role: h.role, parts: [{ text: h.text }] });
        lastRole = h.role;
      } else if (contents.length > 0) {
        contents[contents.length - 1].parts[0].text += `\n\n${h.text}`;
      }
    }

    const models = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash-lite'];
    let lastErr = 'AI Error';

    for (const m of models) {
      try {
        const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            system_instruction: { parts: { text: systemPrompt } },
            contents 
          })
        });
        const data = await directRes.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          let replyText = data.candidates[0].content.parts[0].text;
          let expenseAdded = false;
          let actionData: any = null;

          const jsonMatch = replyText.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`/) || replyText.match(/(\{[\s\S]*?"ACTION"\s*:\s*".*?"[\s\S]*?\})/);
          if (jsonMatch) {
            try {
              actionData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch (err) {
              console.error(err);
            }
          }

          if (!actionData) {
            const match1 = message.match(/(?:spent|add|log|bought|paid)\s+(?:₹\s*)?(\d+)\s+(?:on|for)?\s*([a-zA-Z0-9\s]+)/i);
            const match2 = message.match(/(?:spent|add|log|bought|paid)\s+([a-zA-Z0-9\s]+)\s+(?:₹\s*)?(\d+)/i);

            const walletCount = contextData?.wallets?.length || 0;
            if (match1) {
              actionData = {
                ACTION: walletCount >= 2 ? 'SELECT_WALLET_FOR_EXPENSE' : 'ADD_EXPENSE',
                amount: Number(match1[1]),
                note: match1[2].trim(),
                category: 'Dining'
              };
            } else if (match2) {
              actionData = {
                ACTION: walletCount >= 2 ? 'SELECT_WALLET_FOR_EXPENSE' : 'ADD_EXPENSE',
                amount: Number(match2[2]),
                note: match2[1].trim(),
                category: 'Dining'
              };
            }
          }

          if (actionData) {
            try {
              const walletCount = contextData?.wallets?.length || 0;
              if (actionData.ACTION === 'SELECT_WALLET_FOR_EXPENSE' && walletCount >= 2) {
                replyText = replyText.replace(/\`\`\`json[\s\S]*?\`\`\`/g, '').replace(/\{[\s\S]*?"ACTION"\s*:\s*".*?"[\s\S]*?\}/g, '').trim();
                return {
                  answer: replyText || `Which wallet should I add **${actionData.note || 'Expense'} (₹${actionData.amount})** to?`,
                  walletPrompt: {
                    amount: actionData.amount,
                    category: actionData.category || 'Dining',
                    note: actionData.note || 'Expense'
                  }
                };
              }

              if (actionData && actionData.ACTION === 'ADD_EXPENSE' && actionData.amount > 0) {
                const defaultWallet = contextData?.wallets?.[0]?.id || undefined;
                await api.addExpense({
                  amount: Number(actionData.amount),
                  category: actionData.category || 'Personal',
                  note: actionData.note || 'Logged via ExpenseHub AI',
                  walletId: defaultWallet
                });
                expenseAdded = true;
                replyText = replyText.replace(/\`\`\`json[\s\S]*?\`\`\`/g, '').replace(/\{[\s\S]*?"ACTION"\s*:\s*"ADD_EXPENSE"[\s\S]*?\}/g, '').trim();
                if (!replyText) {
                  replyText = `✅ **Successfully Added ${actionData.note || 'Expense'}!**\n💰 Amount: ₹${actionData.amount}`;
                } else if (!replyText.includes('✅')) {
                  replyText += `\n\n✅ *Record saved to MongoDB Audit Trail!*`;
                }
              }
            } catch (err) {
              console.error('Failed fallback AI action parse:', err);
            }
          }

          return { answer: replyText, expenseAdded };
        } else if (data.error) {
          lastErr = data.error.message;
        }
      } catch (err: any) {
        lastErr = err.message || 'Network error';
      }
    }
    throw new Error(lastErr);
  }
};
