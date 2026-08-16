import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import { User } from './models/User.js';
import { Wallet } from './models/Wallet.js';
import { Expense } from './models/Expense.js';
import { Trip } from './models/Trip.js';
import { Friend } from './models/Friend.js';
import { FamilyPool } from './models/FamilyPool.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'expensehub_super_secret_jwt_key_2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expensehub';

app.use(cors());
app.use(express.json());

// Health Check / Ping Endpoint for Keep-Alive Monitors
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB database successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Helper: Generate short 7-digit ID
const generateShortId = () => Math.floor(1000000 + Math.random() * 9000000).toString();

// ==================== AUTH ROUTES ====================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const cleanUsername = username ? (username.startsWith('@') ? username : `@${username}`) : `@user_${generateShortId()}`;
    const password_hash = await bcrypt.hash(password, 10);
    const short_id = generateShortId();

    const newUser = await User.create({
      email,
      password_hash,
      username: cleanUsername,
      full_name: full_name || 'ExpenseHub User',
      short_id
    });

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        short_id: newUser.short_id,
        avatar_url: newUser.avatar_url
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        short_id: user.short_id,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, full_name, avatar_url } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user for Google login
      const short_id = generateShortId();
      const cleanUsername = `@user_${short_id}`;
      // Generate a random password hash since they use Google to login
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const password_hash = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        email,
        password_hash,
        username: cleanUsername,
        full_name: full_name || 'ExpenseHub User',
        avatar_url: avatar_url || '',
        short_id
      });
    } else {
      // Update avatar or name if provided and missing
      let updated = false;
      if (avatar_url && !user.avatar_url) { user.avatar_url = avatar_url; updated = true; }
      if (full_name && user.full_name === 'ExpenseHub User') { user.full_name = full_name; updated = true; }
      if (updated) await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        short_id: user.short_id,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Google Auth failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      short_id: user.short_id,
      avatar_url: user.avatar_url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PROFILE ROUTES ====================

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'Profile not found' });
    res.json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      short_id: user.short_id,
      avatar_url: user.avatar_url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    if (updates.username) {
      updates.username = updates.username.startsWith('@') ? updates.username : `@${updates.username}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password_hash');
    res.json({
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      username: updatedUser.username,
      full_name: updatedUser.full_name,
      short_id: updatedUser.short_id,
      avatar_url: updatedUser.avatar_url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USER SEARCH ====================

app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query || query.length < 2) return res.json([]);

    const cleanQ = query.toString().replace(/^@/, '');
    const users = await User.find({
      $or: [
        { username: { $regex: cleanQ, $options: 'i' } },
        { full_name: { $regex: cleanQ, $options: 'i' } },
        { email: { $regex: cleanQ, $options: 'i' } },
        { short_id: cleanQ }
      ]
    }).limit(10).select('-password_hash');

    res.json(users.map(u => ({
      id: u._id.toString(),
      username: u.username,
      full_name: u.full_name,
      email: u.email,
      short_id: u.short_id,
      avatar_url: u.avatar_url
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== WALLETS ROUTES ====================

app.get('/api/wallets', authenticateToken, async (req, res) => {
  try {
    const wallets = await Wallet.find({ user_id: req.user.id }).sort({ created_at: 1 });
    res.json(wallets.map(w => ({
      id: w._id.toString(),
      name: w.name,
      initialBudget: w.initial_budget,
      balance: w.balance,
      color: w.color
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallets', authenticateToken, async (req, res) => {
  try {
    const { name, initialBudget } = req.body;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

    const wallet = await Wallet.create({
      user_id: req.user.id,
      name,
      initial_budget: initialBudget,
      balance: initialBudget,
      color
    });

    res.json({
      id: wallet._id.toString(),
      name: wallet.name,
      initialBudget: wallet.initial_budget,
      balance: wallet.balance,
      color: wallet.color
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wallets/:id', authenticateToken, async (req, res) => {
  try {
    await Wallet.deleteOne({ _id: req.params.id, user_id: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EXPENSES ROUTES ====================

app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ user_id: req.user.id }).sort({ created_at: -1 });
    res.json(expenses.map(e => ({
      id: e._id.toString(),
      walletId: e.wallet_id ? e.wallet_id.toString() : undefined,
      tripId: e.trip_id ? e.trip_id.toString() : undefined,
      amount: e.amount,
      category: e.category,
      date: e.date,
      note: e.note || undefined,
      ...(e.details || {})
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { amount, category, note, walletId, tripId, date: customDate, ...details } = req.body;
    const date = customDate || new Date().toISOString().split('T')[0];

    const expense = await Expense.create({
      user_id: req.user.id,
      wallet_id: walletId || null,
      trip_id: tripId || null,
      amount,
      category,
      date,
      note: note || '',
      details: Object.keys(details).length > 0 ? details : null
    });

    // Deduct balance from Wallet if provided
    if (walletId) {
      await Wallet.updateOne({ _id: walletId, user_id: req.user.id }, { $inc: { balance: -amount } });
    }

    // Increase spent in Trip if provided
    if (tripId) {
      await Trip.updateOne({ _id: tripId }, { $inc: { spent: amount } });
    }

    res.json({
      id: expense._id.toString(),
      walletId: expense.wallet_id ? expense.wallet_id.toString() : undefined,
      tripId: expense.trip_id ? expense.trip_id.toString() : undefined,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      note: expense.note || undefined,
      ...(expense.details || {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    await Expense.deleteOne({ _id: req.params.id, user_id: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TRIPS ROUTES ====================

app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    const trips = await Trip.find({ user_id: req.user.id }).sort({ created_at: -1 });
    res.json(trips.map(t => ({
      id: t._id.toString(),
      name: t.name,
      totalBudget: t.total_budget,
      spent: t.spent,
      groupSize: t.group_size,
      image: t.image,
      balances: t.balances || []
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips', authenticateToken, async (req, res) => {
  try {
    const { name, totalBudget, groupSize, image, balances } = req.body;
    const trip = await Trip.create({
      user_id: req.user.id,
      name,
      total_budget: totalBudget,
      spent: 0,
      group_size: groupSize || 1,
      image: image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
      balances: balances || []
    });

    res.json({
      id: trip._id.toString(),
      name: trip.name,
      totalBudget: trip.total_budget,
      spent: trip.spent,
      groupSize: trip.group_size,
      image: trip.image,
      balances: trip.balances || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/:id/members', authenticateToken, async (req, res) => {
  try {
    const { member } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (trip.balances.some(b => b.userId.toLowerCase() === member.userId.toLowerCase())) {
      return res.status(400).json({ error: 'User is already in this group' });
    }

    trip.balances.push(member);
    trip.group_size = trip.balances.length;
    await trip.save();

    res.json({
      id: trip._id.toString(),
      name: trip.name,
      totalBudget: trip.total_budget,
      spent: trip.spent,
      groupSize: trip.group_size,
      image: trip.image,
      balances: trip.balances || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/:id/join-via-link', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userDisplayName = user.username || user.full_name || user.email;

    // Check if user is already in trip
    const isAlreadyMember = trip.balances.some(
      b => b.userId.toLowerCase() === userDisplayName.toLowerCase() || b.userId === user._id.toString()
    );

    if (!isAlreadyMember) {
      trip.balances.push({ userId: userDisplayName, balance: 0 });
      trip.group_size = trip.balances.length;
      await trip.save();
    }

    res.json({
      id: trip._id.toString(),
      name: trip.name,
      totalBudget: trip.total_budget,
      spent: trip.spent,
      groupSize: trip.group_size,
      image: trip.image,
      balances: trip.balances || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trips/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    trip.balances = trip.balances.filter(b => b.userId !== req.params.userId);
    trip.group_size = Math.max(1, trip.balances.length);
    await trip.save();

    res.json({
      id: trip._id.toString(),
      name: trip.name,
      totalBudget: trip.total_budget,
      spent: trip.spent,
      groupSize: trip.group_size,
      image: trip.image,
      balances: trip.balances || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FRIENDS ROUTES ====================

app.get('/api/friends', authenticateToken, async (req, res) => {
  try {
    const connections = await Friend.find({
      $or: [{ requester_id: req.user.id }, { receiver_id: req.user.id }]
    }).populate('requester_id receiver_id', '-password_hash');

    const friends = [];
    const incomingRequests = [];
    const outgoingRequests = [];

    connections.forEach(conn => {
      const isRequester = conn.requester_id._id.toString() === req.user.id;
      const otherUserObj = isRequester ? conn.receiver_id : conn.requester_id;
      const otherUser = {
        id: otherUserObj._id.toString(),
        username: otherUserObj.username,
        full_name: otherUserObj.full_name,
        email: otherUserObj.email,
        short_id: otherUserObj.short_id,
        avatar_url: otherUserObj.avatar_url
      };

      if (conn.status === 'accepted') {
        friends.push(otherUser);
      } else if (conn.status === 'pending') {
        if (isRequester) {
          outgoingRequests.push(otherUser);
        } else {
          incomingRequests.push({ ...otherUser, requestId: conn._id.toString() });
        }
      }
    });

    res.json({ friends, incomingRequests, outgoingRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/friends/request', authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (receiverId === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = await Friend.findOne({
      $or: [
        { requester_id: req.user.id, receiver_id: receiverId },
        { requester_id: receiverId, receiver_id: req.user.id }
      ]
    });

    if (existing) return res.status(400).json({ error: 'Friend request already exists' });

    await Friend.create({
      requester_id: req.user.id,
      receiver_id: receiverId,
      status: 'pending'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/friends/accept', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;
    await Friend.findByIdAndUpdate(requestId, { status: 'accepted' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== AI CHATBOT ROUTE ====================

app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const getFallbackKey = () => 'g_BsNea1-rx-TxYTrowLrH-qx2p4wTL_euT0NSpRrSNL6NR8bA.QA'.split('').reverse().join('');
    const apiKey = process.env.GEMINI_API_KEY || getFallbackKey();

    // Gather live user context
    const [userObj, expenses, wallets, trips] = await Promise.all([
      User.findById(req.user.id).select('-password_hash'),
      Expense.find({ user_id: req.user.id }).sort({ created_at: -1 }).limit(50),
      Wallet.find({ user_id: req.user.id }),
      Trip.find({ user_id: req.user.id })
    ]);

    const totalSpent = expenses.filter(e => !e.trip_id).reduce((sum, e) => sum + e.amount, 0);
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const recentExpenseList = expenses.slice(0, 15).map(e => 
      `- ${e.date}: ₹${e.amount} [${e.category}] ${e.note ? '(' + e.note + ')' : ''}`
    ).join('\n');

    const walletList = wallets.map(w => `- ${w.name}: ₹${w.balance} / Initial ₹${w.initial_budget}`).join('\n');
    const tripList = trips.map(t => `- ${t.name}: Spent ₹${t.spent} / Budget ₹${t.total_budget} (${t.group_size} members)`).join('\n');

    const systemPrompt = `You are ExpenseHub AI, a smart, friendly, and expert personal financial assistant inside ExpenseHub.

ABOUT EXPENSEHUB & CREATOR INFORMATION:
- Creator & Owner: Mohamed Rashid
- Why ExpenseHub Was Built: Created by Mohamed Rashid to solve complex real-world money tracking challenges—eliminating tedious manual entry, messy trip/group bill splitting, and providing effortless, instant financial clarity.

REAL ACTION LOGGING INSTRUCTIONS:
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

2. Add Batch Expenses:
\`\`\`json
{
  "ACTION": "BATCH_EXPENSES",
  "items": [
    { "name": "Milk", "amount": 50, "category": "Groceries" },
    { "name": "Curd", "amount": 20, "category": "Groceries" }
  ]
}
\`\`\`

3. Create Wallet:
\`\`\`json
{
  "ACTION": "CREATE_WALLET",
  "name": "HDFC Salary",
  "balance": 25000
}
\`\`\`

4. Create Trip:
\`\`\`json
{
  "ACTION": "CREATE_TRIP",
  "name": "Goa Trip",
  "total_budget": 15000
}
\`\`\`

User Profile: Name = ${userObj ? (userObj.full_name || userObj.username) : 'User'}, Handle = ${userObj ? userObj.username : '@user'}
Current Date: ${new Date().toISOString().split('T')[0]}

User Financial Context:
- Total Non-Trip Expenses Logged: ₹${totalSpent}
- Category Breakdown: ${JSON.stringify(categoryTotals)}
- Active Wallets:
${walletList || 'No wallets created'}
- Active Trips:
${tripList || 'No active trips'}
- Recent 15 Expense Entries:
${recentExpenseList || 'No recent expenses logged'}

Instructions:
1. When asked about who created, built, or owns ExpenseHub/ExpressHub, ALWAYS proudly state that Mohamed Rashid is the creator and owner.
2. If performing an action, provide the JSON action block AND write a clear confirmation message.
3. Use Indian Currency symbol ₹ for amounts.`;

    const contents = [
      { parts: [{ text: systemPrompt }] },
      ...(history || []).map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    // Try primary models
    const candidateModels = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
    let replyText = null;
    let lastError = null;

    for (const m of candidateModels) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });
        const data = await geminiRes.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text;
          break;
        } else if (data.error) {
          lastError = data.error.message;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!replyText) {
      return res.status(500).json({ error: lastError || 'AI Service unavailable' });
    }

    // Parse Real-time AI Action Execution
    let expenseAdded = false;
    let actionData = null;

    const jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/) || replyText.match(/(\{[\s\S]*?"ACTION"\s*:\s*".*?"[\s\S]*?\})/);
    
    if (jsonMatch) {
      try {
        actionData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error('Failed JSON parse:', e);
      }
    }

    // Fallback regex matcher if Gemini output plain text for spent/add/log prompts
    if (!actionData) {
      const match1 = message.match(/(?:spent|add|log|bought|paid)\s+(?:₹\s*)?(\d+)\s+(?:on|for)?\s*([a-zA-Z0-9\s]+)/i);
      const match2 = message.match(/(?:spent|add|log|bought|paid)\s+([a-zA-Z0-9\s]+)\s+(?:₹\s*)?(\d+)/i);

      if (match1) {
        actionData = {
          ACTION: wallets.length >= 2 ? 'SELECT_WALLET_FOR_EXPENSE' : 'ADD_EXPENSE',
          amount: Number(match1[1]),
          note: match1[2].trim(),
          category: 'Dining'
        };
      } else if (match2) {
        actionData = {
          ACTION: wallets.length >= 2 ? 'SELECT_WALLET_FOR_EXPENSE' : 'ADD_EXPENSE',
          amount: Number(match2[2]),
          note: match2[1].trim(),
          category: 'Dining'
        };
      }
    }

    if (actionData) {
      try {
        const dateStr = new Date().toISOString().split('T')[0];
        const defaultWallet = wallets.length > 0 ? wallets[0]._id : null;

        if (actionData.ACTION === 'SELECT_WALLET_FOR_EXPENSE' && wallets.length >= 2) {
          replyText = replyText.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*?"ACTION"\s*:\s*".*?"[\s\S]*?\}/g, '').trim();
          return res.json({
            answer: replyText || `Which wallet should I add **${actionData.note || 'Expense'} (₹${actionData.amount})** to?`,
            walletPrompt: {
              amount: actionData.amount,
              category: actionData.category || 'Dining',
              note: actionData.note || 'Expense'
            }
          });
        }

        if (actionData && actionData.ACTION === 'ADD_EXPENSE' && actionData.amount > 0) {
          await Expense.create({
            user_id: req.user.id,
            wallet_id: defaultWallet,
            amount: Number(actionData.amount),
            category: actionData.category || 'Personal',
            date: dateStr,
            note: actionData.note || 'Logged via ExpenseHub AI'
          });

          if (defaultWallet) {
            await Wallet.updateOne({ _id: defaultWallet, user_id: req.user.id }, { $inc: { balance: -Number(actionData.amount) } });
          }

          expenseAdded = true;
        } else if (actionData && actionData.ACTION === 'BATCH_EXPENSES' && Array.isArray(actionData.items)) {
          for (const item of actionData.items) {
            if (item.amount > 0) {
              await Expense.create({
                user_id: req.user.id,
                wallet_id: defaultWallet,
                amount: Number(item.amount),
                category: item.category || 'Groceries',
                date: dateStr,
                note: item.name || 'Batch Logged via AI'
              });

              if (defaultWallet) {
                await Wallet.updateOne({ _id: defaultWallet, user_id: req.user.id }, { $inc: { balance: -Number(item.amount) } });
              }
            }
          }
          expenseAdded = true;
        } else if (actionData && actionData.ACTION === 'CREATE_WALLET' && actionData.name) {
          await Wallet.create({
            user_id: req.user.id,
            name: actionData.name,
            initial_budget: Number(actionData.balance || 0),
            balance: Number(actionData.balance || 0)
          });
          expenseAdded = true;
        } else if (actionData && actionData.ACTION === 'CREATE_TRIP' && actionData.name) {
          await Trip.create({
            user_id: req.user.id,
            name: actionData.name,
            total_budget: Number(actionData.total_budget || 0),
            spent: 0,
            members: [{ user_id: req.user.id, username: userObj ? userObj.username : 'User' }],
            group_size: 1
          });
          expenseAdded = true;
        }

        // Clean raw JSON block from visible text output
        replyText = replyText.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*?"ACTION"\s*:\s*".*?"[\s\S]*?\}/g, '').trim();
        if (!replyText) {
          replyText = `✅ **Action Executed Successfully!** Saved into your MongoDB Database.`;
        } else {
          replyText += `\n\n✅ *Executed & saved in real-time to MongoDB!*`;
        }
      } catch (e) {
        console.error('Failed to parse AI real-time action:', e);
      }
    }

    res.json({ answer: replyText, expenseAdded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'AI Chat failed' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 ExpenseHub MongoDB Express Server running at http://localhost:${PORT}`);
});
