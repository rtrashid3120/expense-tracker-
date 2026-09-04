import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiZap, FiTrash2 } from 'react-icons/fi';
import { useAppStore } from '../store';
import { api } from '../api';

interface OptionGroup {
  title: string;
  options: { label: string; prompt: string }[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  walletPrompt?: { 
    amount: number; 
    category: string; 
    note: string; 
    date?: string; 
    dateLabel?: string;
    multiItems?: Array<{ amount: number; category: string; note: string; date?: string; dateLabel?: string }>;
  };
  periodPrompts?: string[];
  optionGroups?: OptionGroup[];
}

const STORAGE_KEY = 'expensehub_ai_chat_messages';

const quickPrompts = [
  'spent 50 coffee',
  'delete spent 50 coffee',
  'How much spent this month?',
  'Which wallet has highest balance?'
];

const getCategoryKeywords = (querySubject: string): string[] => {
  const k = querySubject.toLowerCase().trim();
  
  if (/grocery|groceries|vegetable|veg|milk|fruit|supermarket|biscuit|snack/i.test(k)) {
    return ['grocery', 'groceries', 'food', 'vegetable', 'milk', 'fruit', 'snack', 'biscuit'];
  }
  if (/coffee|tea|cafe|starbucks|dining|food|lunch|dinner|restaurant|pizza|burger|swiggy|zomato/i.test(k)) {
    return ['coffee', 'tea', 'dining', 'food', 'lunch', 'dinner', 'restaurant', 'pizza', 'burger', 'cafe'];
  }
  if (/fuel|petrol|diesel|cab|uber|ola|bus|train|flight|auto|transport|travel/i.test(k)) {
    return ['fuel', 'petrol', 'diesel', 'cab', 'transport', 'travel', 'uber', 'ola', 'auto'];
  }
  if (/rent|flat|electricity|water|wifi|bill|maintenance/i.test(k)) {
    return ['rent', 'bill', 'electricity', 'water', 'wifi'];
  }
  if (/medical|doctor|medicine|hospital|pharmacy|tablet/i.test(k)) {
    return ['medical', 'doctor', 'medicine', 'hospital', 'tablet'];
  }
  if (/shopping|cloth|clothes|shoes|amazon|flipkart/i.test(k)) {
    return ['shopping', 'cloth', 'clothes', 'shoes', 'amazon', 'flipkart'];
  }

  const singular = k.replace(/(es|s)$/i, '');
  return [k, singular];
};

const parseMultiExpenses = (query: string) => {
  let cleanedQuery = query.toLowerCase();
  
  // 1. Extract target date first (e.g. "on 26 aug", "yesterday", "2 days ago")
  let targetDateStr = new Date().toISOString().split('T')[0];
  let dateDisplayLabel = '';
  const now = new Date();

  // Check relative day keywords
  if (/\b(yesterday)\b/i.test(cleanedQuery)) {
    const d = new Date();
    d.setDate(now.getDate() - 1);
    targetDateStr = d.toISOString().split('T')[0];
    dateDisplayLabel = `Yesterday (${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    cleanedQuery = cleanedQuery.replace(/\b(yesterday)\b/gi, '');
  } else if (/\b(day before yesterday)\b/i.test(cleanedQuery)) {
    const d = new Date();
    d.setDate(now.getDate() - 2);
    targetDateStr = d.toISOString().split('T')[0];
    dateDisplayLabel = `Day before yesterday (${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    cleanedQuery = cleanedQuery.replace(/\b(day before yesterday)\b/gi, '');
  } else if (/(\d+)\s+days?\s+ago/i.test(cleanedQuery)) {
    const daysMatch = cleanedQuery.match(/(\d+)\s+days?\s+ago/i);
    if (daysMatch) {
      const daysAgo = parseInt(daysMatch[1]);
      const d = new Date();
      d.setDate(now.getDate() - daysAgo);
      targetDateStr = d.toISOString().split('T')[0];
      dateDisplayLabel = `${daysAgo} days ago (${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
      cleanedQuery = cleanedQuery.replace(/(\d+)\s+days?\s+ago/gi, '');
    }
  } else {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const dayMonthMatch = cleanedQuery.match(/\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(\d{4}))?\b/i);
    const monthDayMatch = cleanedQuery.match(/\b(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/i);

    let matchedMonth = -1;
    let day = -1;
    let year = now.getFullYear();

    if (dayMonthMatch) {
      day = parseInt(dayMonthMatch[1]);
      const mStr = dayMonthMatch[2].toLowerCase();
      matchedMonth = months.findIndex(m => mStr.startsWith(m));
      if (dayMonthMatch[3]) year = parseInt(dayMonthMatch[3]);
      cleanedQuery = cleanedQuery.replace(dayMonthMatch[0], '');
    } else if (monthDayMatch) {
      const mStr = monthDayMatch[1].toLowerCase();
      matchedMonth = months.findIndex(m => mStr.startsWith(m));
      day = parseInt(monthDayMatch[2]);
      if (monthDayMatch[3]) year = parseInt(monthDayMatch[3]);
      cleanedQuery = cleanedQuery.replace(monthDayMatch[0], '');
    }

    if (matchedMonth !== -1 && day > 0 && day <= 31) {
      const d = new Date(year, matchedMonth, day);
      targetDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateDisplayLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  }

  // 2. Split into multi-clause items by comma or "and" / "&"
  const rawClauses = cleanedQuery.split(/,|\band\b|&/i).map(s => s.trim()).filter(Boolean);
  const items: Array<{ amount: number; category: string; note: string; date?: string; dateLabel?: string }> = [];

  for (const clause of rawClauses) {
    const numMatch = clause.match(/(\d+)/);
    if (!numMatch) continue;

    const amount = Number(numMatch[1]);
    let note = clause
      .replace(/(\d+(?:\.\d+)?)/g, '') // remove the number part
      .replace(/\b(spend|spending|spent|cost|gave|took|charge|charged|purchase|purchased|add|log|bought|paid|on|for|at|in|to|from|rupees|rs|inr|bucks|₹)\b/gi, '')
      .replace(/[^\w\s-]/gi, '') // remove lingering weird symbols like commas
      .replace(/\s+/g, ' ') // clean up double spaces
      .trim();

    if (!note) note = 'Expense';
    
    // Capitalize note
    const formattedNote = note.charAt(0).toUpperCase() + note.slice(1);

    // Infer category
    let category = 'Other';
    const noteLower = note.toLowerCase();
    
    if (/coffee|tea|cafe|starbucks|dining|food|lunch|dinner|restaurant|pizza|burger|snack|chicken|swiggy|zomato|kfc|mcdonalds/i.test(noteLower)) category = 'Dining';
    else if (/fuel|petrol|diesel|cab|uber|ola|bus|train|flight|auto|ticket|parking|rapido/i.test(noteLower)) category = 'Transport';
    else if (/grocery|groceries|banana|apple|fruit|supermarket|vegetables|milk|fruits|rice|bread|eggs/i.test(noteLower)) category = 'Groceries';
    else if (/rent|flat|electricity|water|wifi|bill|maintenance/i.test(noteLower)) category = 'Rent';
    else if (/shopping|cloth|clothes|shoes|amazon|flipkart|myntra|shirt|pant|jeans/i.test(noteLower)) category = 'Shopping';
    else if (/medical|pharmacy|apollo|doctor|hospital|tablet|medicine|pill|health/i.test(noteLower)) category = 'Medical';
    else if (/movie|cinema|netflix|spotify|games|concert|mall|entertainment|prime|show/i.test(noteLower)) category = 'Personal';
    else if (/trip|travel|hotel|resort|vacation/i.test(noteLower)) category = 'Travel';

    items.push({
      amount,
      category,
      note: formattedNote,
      date: targetDateStr,
      dateLabel: dateDisplayLabel
    });
  }

  return { items, targetDateStr, dateDisplayLabel };
};

const generateLocalFinancialAnswer = (
  query: string,
  wallets: any[],
  expenses: any[],
  trips: any[],
  monthlyBudget: number,
  _profile: any
): string => {
  const lower = query.toLowerCase().trim();
  const totalBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (/who (created|built|made|owns)|creator|owner|mohamed|rashid/i.test(lower)) {
    return `🌟 **ExpenseHub was designed and built by Mohamed Rashid!**\n\nHe crafted ExpenseHub as an all-in-one financial operating system—giving you effortless expense logging, smart wallet budgeting, trip bill splitting, and instant financial clarity.`;
  }

  if (/(^|\b)(trip|trips|vacation|tour|holiday)(\b|$)/i.test(lower)) {
    if (trips.length === 0) {
      return `✈️ **No Active Trips Found**\n\nYou haven't created any trips yet. You can create a trip in the **Trips** tab to split bills and track shared vacation expenses with friends!`;
    }
    let text = `✈️ **Active Trips Summary** (${trips.length} active):\n\n`;
    trips.forEach((t: any) => {
      const budget = Number(t.totalBudget || t.total_budget || 0);
      const spent = Number(t.spent || 0);
      const remaining = Math.max(0, budget - spent);
      const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      const size = t.groupSize || t.group_size || (t.balances?.length || 1);
      text += `• **${t.name}**:\n  - Spent: ₹${spent.toLocaleString('en-IN')} / Budget: ₹${budget.toLocaleString('en-IN')} (${percent}% used)\n  - Remaining: ₹${remaining.toLocaleString('en-IN')}\n  - Members: ${size} people\n\n`;
    });
    return text.trim();
  }

  if (/(^|\b)(50\s*30\s*20|50\/30\/20|rule 50)(\b|$)/i.test(lower)) {
    const baseAmount = monthlyBudget > 0 ? monthlyBudget : (totalBalance > 0 ? totalBalance : 50000);
    const needs = Math.round(baseAmount * 0.50);
    const wants = Math.round(baseAmount * 0.30);
    const savings = Math.round(baseAmount * 0.20);

    return `📐 **The 50/30/20 Budgeting Rule** (Tailored for you):\n\n` +
      `Based on your ${monthlyBudget > 0 ? `Monthly Budget (₹${monthlyBudget.toLocaleString('en-IN')})` : `Total Balance (₹${baseAmount.toLocaleString('en-IN')})`}:\n\n` +
      `• 🏠 **50% Needs (₹${needs.toLocaleString('en-IN')})**: Essential expenses (Rent, Groceries, Utilities, Bills, Fuel/Transport)\n` +
      `• ☕ **30% Wants (₹${wants.toLocaleString('en-IN')})**: Discretionary spending (Dining out, Shopping, Entertainment, Coffee)\n` +
      `• 💰 **20% Savings (₹${savings.toLocaleString('en-IN')})**: Emergency Fund, Investments, and Debt clearance\n\n` +
      `💡 *ExpenseHub Tip: Track your categories to ensure your Wants stay under ₹${wants.toLocaleString('en-IN')}!*`;
  }

  if (/(^|\b)(wallet|wallets|balance|cash|funds|net balance)(\b|$)/i.test(lower)) {
    let text = `👛 **Active Wallets & Total Balance**:\n\n`;
    wallets.forEach((w: any) => {
      text += `• **${w.name}**: ₹${(w.balance || 0).toLocaleString('en-IN')}\n`;
    });
    text += `\n💰 **Total Across All Wallets**: ₹${totalBalance.toLocaleString('en-IN')}`;
    return text;
  }

  if (/(^|\b)(budget|budget left|budget status|over budget)(\b|$)/i.test(lower)) {
    const percent = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;
    const remaining = monthlyBudget > 0 ? monthlyBudget - totalSpent : 0;
    return `🎯 **Budget Overview**:\n\n` +
      `• **Monthly Target**: ₹${monthlyBudget.toLocaleString('en-IN')}\n` +
      `• **Total Expenses Logged**: ₹${totalSpent.toLocaleString('en-IN')} (${percent}% utilized)\n` +
      `• **Remaining Allowance**: ₹${remaining.toLocaleString('en-IN')}\n` +
      `• **Current Total Wallet Cash**: ₹${totalBalance.toLocaleString('en-IN')}`;
  }

  if (/(^|\b)(tips|how to save|save money|reduce spending|financial advice|cut expenses)(\b|$)/i.test(lower)) {
    const catMap: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cat = e.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + e.amount;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    let text = `💡 **Personalized Financial & Savings Tips**:\n\n`;
    if (topCat) {
      text += `1. 🎯 **Tackle Your #1 Category (${topCat[0]} - ₹${topCat[1].toLocaleString('en-IN')})**:\n   Your highest spending is in **${topCat[0]}**. Setting a targeted limit here is your easiest win!\n\n`;
    }
    text += `2. 👛 **Allocate by Wallet**:\n   Use dedicated wallets for separate purposes to prevent overspending.\n\n`;
    text += `3. ⏳ **The 24-Hour Cooling Rule**:\n   Delay unplanned purchases above ₹1,000 for 24 hours to reduce impulse spending.\n\n`;
    text += `4. ⚡ **Monitor Spending Velocity**:\n   Check *"spending velocity"* regularly to see your projected month-end total!`;
    return text;
  }

  // Category breakdown
  const catMap: Record<string, number> = {};
  expenses.forEach((e: any) => {
    const cat = e.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + e.amount;
  });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  return `👋 **ExpenseHub AI Financial Assistant**\n\n` +
    `Here is your real-time financial snapshot:\n` +
    `• **Total Available Balance**: ₹${totalBalance.toLocaleString('en-IN')} across ${wallets.length} active wallet${wallets.length === 1 ? '' : 's'}\n` +
    `• **Total Expenses Tracked**: ₹${totalSpent.toLocaleString('en-IN')}\n` +
    (topCat ? `• **Top Spending Category**: ${topCat[0]} (₹${topCat[1].toLocaleString('en-IN')})\n` : '') +
    `\n**You can ask me to:**\n` +
    `• ➕ **Log Expenses**: *"spent 50 coffee yesterday"*, *"paid 200 fuel"*\n` +
    `• 🗑️ **Delete Expenses**: *"delete spent 50 coffee"*\n` +
    `• 📊 **Filter & Breakdown**: *"show fuel expenses"*, *"category breakdown"*\n` +
    `• 👛 **Check Balances**: *"which wallet has highest balance"*, *"total balance"*\n` +
    `• ⚡ **Insights**: *"how fast am i spending"*, *"safe to spend 500?"*`;
};

export function AIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load chat history from storage:', e);
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `👋 **Welcome to ExpenseHub AI!**\nYour 24/7 Executive Financial Assistant created by **Mohamed Rashid**.\n\n⚡ **How to use me efficiently:**\n• ➕ **Add Expenses:** Type \`spent 50 coffee\` or \`add cake 40\`\n• 🗑️ **Delete Expenses:** Type \`delete spent 50 coffee\` or \`remove petrol 250\`\n• 📊 **Period Breakdowns:** Ask \`how much I spent on grocery\` and I will present Weekly, Monthly & All-Time period options!\n• 👛 **Multi-Wallet Support:** 1-Click buttons to choose your wallet!\n• 👑 **About App:** Ask me about Mohamed Rashid or ExpenseHub specialties!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { expenses, wallets, trips, monthlyBudget, balance, profile, fetchData } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [messages]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpen);
    return () => window.removeEventListener('open-ai-chat', handleOpen);
  }, []);

  const handleSelectWallet = async (
    msgId: string, 
    wallet: any, 
    prompt: { 
      amount: number; 
      category: string; 
      note: string; 
      date?: string; 
      dateLabel?: string;
      multiItems?: Array<{ amount: number; category: string; note: string; date?: string; dateLabel?: string }>;
    }
  ) => {
    try {
      const walletId = wallet.id || wallet._id;
      const itemsToAdd = prompt.multiItems && prompt.multiItems.length > 0
        ? prompt.multiItems
        : [{ amount: prompt.amount, category: prompt.category, note: prompt.note, date: prompt.date, dateLabel: prompt.dateLabel }];

      for (const item of itemsToAdd) {
        await api.addExpense({
          amount: item.amount,
          category: item.category,
          note: item.note,
          walletId,
          ...(item.date ? { date: item.date } : {})
        });
      }

      await fetchData(true);

      let confirmText = '';
      if (itemsToAdd.length === 1) {
        confirmText = `✅ **Successfully Recorded in ${wallet.name}!**\n- **Amount:** ₹${itemsToAdd[0].amount}\n- **Category:** ${itemsToAdd[0].category}\n- **Item:** ${itemsToAdd[0].note}${itemsToAdd[0].dateLabel ? `\n- **Date:** ${itemsToAdd[0].dateLabel}` : ''}\n- **Wallet:** ${wallet.name}`;
      } else {
        confirmText = `✅ **Successfully Recorded ${itemsToAdd.length} Expenses in ${wallet.name}!**\n\n`;
        itemsToAdd.forEach(it => {
          confirmText += `• ₹${it.amount} - ${it.note} (${it.category})\n`;
        });
        const total = itemsToAdd.reduce((s, i) => s + i.amount, 0);
        confirmText += `\n💰 **Total Logged:** ₹${total.toLocaleString('en-IN')}`;
      }

      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            walletPrompt: undefined,
            text: confirmText
          };
        }
        return m;
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputMsg;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputMsg('');

    // Re-fetch fresh store state
    const storeState = useAppStore.getState();
    const currentWallets = storeState.wallets.length > 0 ? storeState.wallets : wallets;
    const currentExpenses = storeState.expenses.length > 0 ? storeState.expenses : expenses;

    // Filter out expenses belonging to deleted / inactive wallets with string ID normalization
    const activeWalletIds = new Set(currentWallets.map(w => String(w.id || (w as any)._id)));
    const validExpenses = currentExpenses.filter(e => {
      if (!e.walletId) return true;
      return activeWalletIds.has(String(e.walletId));
    });

    // Check 1: Expense Deletion Intent (e.g. "delete spent 50 coffee", "remove coffee 50")
    const isDeleteIntent = /\b(delete|remove|cancel|undo|erase|drop)\b/i.test(query);
    if (isDeleteIntent) {
      const numMatch = query.match(/(\d+)/);
      const amount = numMatch ? Number(numMatch[1]) : null;
      let cleanNote = query.replace(/(\d+)/g, '').replace(/\b(delete|remove|cancel|undo|erase|drop|spent|add|log|bought|paid|on|for|rupees|rs|₹|expense|last|latest|item)\b/gi, '').trim();

      let target = validExpenses.find(e => {
        const matchAmount = amount ? e.amount === amount : true;
        const matchNote = cleanNote ? (e.note || '').toLowerCase().includes(cleanNote.toLowerCase()) : true;
        return matchAmount && matchNote;
      });

      if (!target && amount) {
        target = validExpenses.find(e => e.amount === amount);
      }

      if (target) {
        try {
          const targetId = target.id || (target as any)._id;
          await api.deleteExpense(targetId);
          await fetchData(true);

          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `✅ Successfully Deleted Expense!\n- Item: ${target.note || 'Expense'}\n- Amount: ₹${target.amount}\n- Category: ${target.category}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        } catch (err: any) {
          alert(err.message || 'Failed to delete expense');
        }
      } else {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ Couldn't find an expense to delete.\nSearched for: ${cleanNote ? `"${cleanNote}"` : ''} ${amount ? `₹${amount}` : ''}\n\nTip: Check your Audit Trail for full item details or exact amounts.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }
    }

    // Check 1.15: Price Range / Threshold Search Intent (e.g. "expenses over 500", "expenses under 100")
    const isThresholdQuery = /\b(expenses over|expenses under|above|below|more than|less than|greater than)\b/i.test(query);
    if (isThresholdQuery && !isDeleteIntent) {
      const numMatch = query.match(/(\d+)/);
      const threshold = numMatch ? Number(numMatch[1]) : 500;
      const isAbove = /\b(over|above|more than|greater than)\b/i.test(query);

      const filtered = validExpenses.filter(e => isAbove ? e.amount >= threshold : e.amount <= threshold);
      const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

      let replyText = `🔍 **Expenses ${isAbove ? '≥' : '≤'} ₹${threshold.toLocaleString('en-IN')}** (${filtered.length} found):\n\n`;
      if (filtered.length > 0) {
        replyText += filtered.map(e => `• ₹${e.amount.toLocaleString('en-IN')} - ${e.note || e.category} (${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`).join('\n');
        replyText += `\n\n💰 **Subtotal**: ₹${totalAmount.toLocaleString('en-IN')}`;
      } else {
        replyText += `No expenses found matching this threshold.`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.16: Navigation & UI Shortcuts (e.g. "go to reports", "take me to trips", "open dashboard")
    const navMatch = query.match(/^(?:go to|take me to|open|show|navigate to)\s+(dashboard|reports|trips|family|audit trail|profile|settings)$/i);
    if (navMatch) {
      const target = navMatch[1].toLowerCase();
      let path = '#/';
      let pageName = 'Dashboard';
      if (target.includes('report')) { path = '#/reports'; pageName = 'Reports & Analytics'; }
      else if (target.includes('trip')) { path = '#/trips'; pageName = 'Trips & Vacations'; }
      else if (target.includes('family')) { path = '#/family'; pageName = 'Family Pool'; }
      else if (target.includes('audit')) { path = '#/audit-trail'; pageName = 'Audit Trail'; }
      else if (target.includes('profile') || target.includes('setting')) { path = '#/profile'; pageName = 'Profile & Settings'; }

      window.location.hash = path;
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `🚀 **Navigating to ${pageName}...**\n\nOpening the ${pageName} page for you right now!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.17: Theme Toggle (e.g. "switch to dark mode", "enable light mode")
    const themeMatch = query.match(/\b(dark mode|light mode)\b/i);
    if (themeMatch && /(switch|toggle|enable|turn on|set)/i.test(query)) {
      const isDark = themeMatch[1].toLowerCase().includes('dark');
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `🎨 **Theme Updated!**\n\nSwitched app theme to **${isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.18: Bill Splitting Calculator (e.g. "split 1200 with 4 friends", "split 1500 among 3 people")
    const splitMatch = query.match(/split\s+(?:₹|rs\.?)?\s*(\d+)\s+(?:between|among|with)\s+(\d+)/i);
    if (splitMatch) {
      const totalAmount = Number(splitMatch[1]);
      const peopleCount = Math.max(1, Number(splitMatch[2]));
      const perPerson = Math.ceil(totalAmount / peopleCount);

      let replyText = `➗ **Bill Splitting Breakdown**:\n\n`;
      replyText += `• **Total Amount**: ₹${totalAmount.toLocaleString('en-IN')}\n`;
      replyText += `• **Split Among**: ${peopleCount} people\n`;
      replyText += `• **Share Per Person**: 💰 **₹${perPerson.toLocaleString('en-IN')}**\n\n`;
      replyText += `💡 *ExpenseHub Tip: You can also record shared travel bills directly in your **Trips** tab!*`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.19: Wallet Transfer (e.g. "transfer 2000 from HDFC to Cash")
    const transferMatch = query.match(/transfer\s+(?:₹|rs\.?)?\s*(\d+)\s+from\s+([a-zA-Z0-9\s]+?)\s+(?:wallet\s+)?to\s+([a-zA-Z0-9\s]+?)(?:\s+wallet)?$/i);
    if (transferMatch) {
      const amt = Number(transferMatch[1]);
      const fromName = transferMatch[2].trim().toLowerCase();
      const toName = transferMatch[3].trim().toLowerCase();

      const sourceWallet = currentWallets.find(w => w.name.toLowerCase().includes(fromName) || fromName.includes(w.name.toLowerCase()));
      const targetWallet = currentWallets.find(w => w.name.toLowerCase().includes(toName) || toName.includes(w.name.toLowerCase()));

      if (!sourceWallet || !targetWallet) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ Couldn't find one of the wallets.\nAvailable wallets: ${currentWallets.map(w => `"${w.name}"`).join(', ')}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      if (sourceWallet.balance < amt) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ **Insufficient Balance in ${sourceWallet.name}!**\nAvailable: ₹${sourceWallet.balance.toLocaleString('en-IN')}, Requested: ₹${amt.toLocaleString('en-IN')}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      try {
        const sId = sourceWallet.id || (sourceWallet as any)._id;
        const tId = targetWallet.id || (targetWallet as any)._id;
        await api.transferWallets(sId, tId, amt);
        await fetchData(true);

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `✅ **Successfully Transferred ₹${amt.toLocaleString('en-IN')}!**\n\n• From: **${sourceWallet.name}** (New Balance: ₹${(sourceWallet.balance - amt).toLocaleString('en-IN')})\n• To: **${targetWallet.name}** (New Balance: ₹${(targetWallet.balance + amt).toLocaleString('en-IN')})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      } catch (err: any) {
        alert(err.message || 'Transfer failed');
      }
    }

    // Check 1.20: Create Wallet (e.g. "create wallet HDFC 25000", "add wallet Cash 5000")
    const createWalletMatch = query.match(/^(?:create|add|new)\s+wallet\s+([a-zA-Z0-9\s]+?)(?:\s+(?:with\s+)?(?:budget|balance)?)?\s+(\d+)$/i);
    if (createWalletMatch) {
      const wName = createWalletMatch[1].trim();
      const wBudget = Number(createWalletMatch[2]);

      try {
        await api.createWallet(wName, wBudget);
        await fetchData(true);

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `👛 **Wallet "${wName}" Created Successfully!**\n\n• **Initial Budget**: ₹${wBudget.toLocaleString('en-IN')}\n• **Current Balance**: ₹${wBudget.toLocaleString('en-IN')}\n\nYou can now log expenses directly into this wallet!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      } catch (err: any) {
        alert(err.message || 'Failed to create wallet');
      }
    }

    // Check 1.21: Delete Wallet (e.g. "delete wallet Cash")
    const deleteWalletMatch = query.match(/^(?:delete|remove)\s+wallet\s+([a-zA-Z0-9\s]+)$/i);
    if (deleteWalletMatch) {
      const targetName = deleteWalletMatch[1].trim().toLowerCase();
      const targetW = currentWallets.find(w => w.name.toLowerCase() === targetName || w.name.toLowerCase().includes(targetName));

      if (targetW) {
        try {
          const wId = targetW.id || (targetW as any)._id;
          await api.deleteWallet(wId);
          await fetchData(true);

          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `🗑️ **Wallet "${targetW.name}" Deleted Successfully!**`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
          return;
        } catch (err: any) {
          alert(err.message || 'Failed to delete wallet');
        }
      } else {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ Wallet "${deleteWalletMatch[1]}" not found.\nActive wallets: ${currentWallets.map(w => `"${w.name}"`).join(', ')}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
    }

    // Check 1.22: Create Trip (e.g. "create trip Goa budget 20000", "new trip Manali 15000")
    const createTripMatch = query.match(/^(?:create|add|new)\s+trip\s+([a-zA-Z0-9\s]+?)(?:\s+(?:with\s+)?budget)?\s+(\d+)$/i);
    if (createTripMatch) {
      const tName = createTripMatch[1].trim();
      const tBudget = Number(createTripMatch[2]);

      try {
        await api.createTrip({
          name: tName,
          totalBudget: tBudget,
          groupSize: 1,
          image: '',
          balances: []
        });
        await fetchData(true);

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `✈️ **Trip "${tName}" Created Successfully!**\n\n• **Budget**: ₹${tBudget.toLocaleString('en-IN')}\n• **Spent**: ₹0\n• **Members**: 1 (You)\n\nYou can now log shared expenses to this trip!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      } catch (err: any) {
        alert(err.message || 'Failed to create trip');
      }
    }

    // Check 1.23: Add Expense to Trip (e.g. "add 500 dinner to Goa trip", "spent 1200 fuel in Goa trip")
    const addTripExpenseMatch = query.match(/(?:add|spent|paid)\s+(?:₹|rs\.?)?\s*(\d+)\s+(?:on|for)?\s*([a-zA-Z0-9\s]+?)\s+(?:to|in)\s+([a-zA-Z0-9\s]+?)\s+trip/i);
    if (addTripExpenseMatch) {
      const amt = Number(addTripExpenseMatch[1]);
      const note = addTripExpenseMatch[2].trim();
      const tripSearch = addTripExpenseMatch[3].trim().toLowerCase();

      const targetTrip = trips.find(t => t.name.toLowerCase().includes(tripSearch) || tripSearch.includes(t.name.toLowerCase()));
      if (targetTrip) {
        try {
          const tripId = targetTrip.id || (targetTrip as any)._id;
          const defaultWallet = currentWallets.length > 0 ? (currentWallets[0].id || (currentWallets[0] as any)._id) : undefined;

          await api.addExpense({
            amount: amt,
            category: 'Travel',
            note,
            tripId,
            walletId: defaultWallet
          } as any);
          await fetchData(true);

          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `✅ **Recorded ₹${amt.toLocaleString('en-IN')} for "${note}" in ${targetTrip.name} trip!**\n\n• **Updated Trip Spent**: ₹${((targetTrip.spent || 0) + amt).toLocaleString('en-IN')} / ₹${(targetTrip.totalBudget || 0).toLocaleString('en-IN')}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
          return;
        } catch (err: any) {
          alert(err.message || 'Failed to log trip expense');
        }
      }
    }

    // Check 1.24: Edit / Update Expense Amount (e.g. "change coffee to 60", "update petrol to 300")
    const editAmountMatch = query.match(/^(?:change|update|edit)\s+([a-zA-Z0-9\s]+?)(?:\s+amount|\s+expense)?\s+(?:from\s+\d+\s+)?to\s+(?:₹|rs\.?)?\s*(\d+)$/i);
    if (editAmountMatch) {
      const itemSearch = editAmountMatch[1].trim().toLowerCase();
      const newAmount = Number(editAmountMatch[2]);

      const targetExp = validExpenses.find(e => 
        (e.note && e.note.toLowerCase().includes(itemSearch)) || 
        (e.category && e.category.toLowerCase().includes(itemSearch)) ||
        itemSearch.includes((e.note || '').toLowerCase())
      );

      if (targetExp) {
        try {
          const expId = targetExp.id || (targetExp as any)._id;
          const oldAmount = targetExp.amount;
          await api.updateExpense(expId, { amount: newAmount });
          await fetchData(true);

          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `✏️ **Expense Updated Successfully!**\n\n• **Item**: ${targetExp.note || targetExp.category}\n• **Old Amount**: ₹${oldAmount.toLocaleString('en-IN')}\n• **New Amount**: 💰 **₹${newAmount.toLocaleString('en-IN')}**\n\n*Wallet balance adjusted automatically.*`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
          return;
        } catch (err: any) {
          alert(err.message || 'Failed to update expense');
        }
      }
    }

    // Check 1.25: Edit Category (e.g. "change category of cake to Groceries")
    const editCatMatch = query.match(/^(?:change|update)\s+category\s+of\s+([a-zA-Z0-9\s]+?)\s+to\s+([a-zA-Z0-9\s]+)$/i);
    if (editCatMatch) {
      const itemSearch = editCatMatch[1].trim().toLowerCase();
      const newCat = editCatMatch[2].trim();

      const targetExp = validExpenses.find(e => 
        (e.note && e.note.toLowerCase().includes(itemSearch)) ||
        (e.category && e.category.toLowerCase().includes(itemSearch))
      );

      if (targetExp) {
        try {
          const expId = targetExp.id || (targetExp as any)._id;
          await api.updateExpense(expId, { category: newCat });
          await fetchData(true);

          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `✏️ **Category Updated!**\n\n• **Item**: ${targetExp.note || 'Expense'}\n• **New Category**: 🏷️ **${newCat}**`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
          return;
        } catch (err: any) {
          alert(err.message || 'Failed to update category');
        }
      }
    }

    // Check 1.26: Month-over-Month Comparison (e.g. "compare this month vs last month", "compare with last month")
    const isCompareMonthQuery = /\b(compare (?:this month )?(?:vs|with|to) last month|last month vs this month)\b/i.test(query);
    if (isCompareMonthQuery) {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastYear = lastMonthDate.getFullYear();

      const thisMonthExpenses = validExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });

      const lastMonthExpenses = validExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
      });

      const thisTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
      const lastTotal = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);
      const diff = thisTotal - lastTotal;
      const percentChange = lastTotal > 0 ? Math.round((Math.abs(diff) / lastTotal) * 100) : 0;

      let replyText = `📊 **Month-over-Month Spending Comparison**:\n\n`;
      replyText += `• **This Month**: ₹${thisTotal.toLocaleString('en-IN')} (${thisMonthExpenses.length} transactions)\n`;
      replyText += `• **Last Month**: ₹${lastTotal.toLocaleString('en-IN')} (${lastMonthExpenses.length} transactions)\n\n`;

      if (lastTotal === 0) {
        replyText += `ℹ️ You have no expenses recorded for last month to compare percentage growth.`;
      } else if (diff > 0) {
        replyText += `🔺 **Spending increased by ${percentChange}% (+₹${diff.toLocaleString('en-IN')})** compared to last month. Consider pacing your discretionary expenses!`;
      } else if (diff < 0) {
        replyText += `🟢 **Great job! Spending decreased by ${percentChange}% (-₹${Math.abs(diff).toLocaleString('en-IN')})** compared to last month. You are saving more!`;
      } else {
        replyText += `⚖️ **Exact match!** Your spending this month is identical to last month.`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.27: Merchant / Keyword Search (e.g. "how much on swiggy", "find amazon expenses", "starbucks expenses")
    const merchantMatch = query.match(/(?:how much (?:did i spend )?on|find|search|show)\s+(swiggy|zomato|amazon|flipkart|starbucks|uber|ola|netflix|blinkit|zepto|supermarket|[a-zA-Z]+)\s*(?:expenses|orders|purchases|bills)?$/i);
    if (merchantMatch && !isDeleteIntent) {
      const kw = merchantMatch[1].toLowerCase().trim();
      if (kw.length > 2 && !/^(the|all|my|wallet|trips|reports|money|budget|spending|food|fuel|dining|groceries|grocery|travel|shopping|medical|rent|bills)$/i.test(kw)) {
        const matches = validExpenses.filter(e => 
          (e.note && e.note.toLowerCase().includes(kw)) ||
          (e.category && e.category.toLowerCase().includes(kw))
        );

        if (matches.length > 0) {
          const totalAmt = matches.reduce((s, e) => s + e.amount, 0);
          let replyText = `🛍️ **Spending on "${kw.toUpperCase()}"** (${matches.length} transactions):\n\n`;
          replyText += matches.map(e => `• ₹${e.amount.toLocaleString('en-IN')} - ${e.note || e.category} (${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`).join('\n');
          replyText += `\n\n💰 **Total Spent**: ₹${totalAmt.toLocaleString('en-IN')}`;

          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
          return;
        }
      }
    }

    // Check 1.28: Family Pool Intent (e.g. "family budget", "show family pool", "family expenses")
    const isFamilyQuery = /(^|\b)(family pool|family budget|family expenses)(\b|$)/i.test(query);
    if (isFamilyQuery) {
      try {
        const pools = await api.getFamilyPools();
        if (pools.length === 0) {
          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `👨‍👩‍👧 **No Active Family Pool Found**\n\nYou haven't created a Family Pool yet. Open the **Family** tab to create a shared pool and track household expenses together!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
          return;
        }

        let replyText = `👨‍👩‍👧 **Family Pool Overview** (${pools.length} active):\n\n`;
        pools.forEach((p: any) => {
          replyText += `• **${p.name || 'Family Pool'}**:\n  - Budget: ₹${(p.totalBudget || p.total_budget || 0).toLocaleString('en-IN')}\n  - Members: ${p.members?.length || 1} people\n\n`;
        });

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // Check 1.29: Export Intent (e.g. "export expenses", "download report", "export csv")
    const isExportQuery = /\b(export|download report|export csv|download expenses)\b/i.test(query);
    if (isExportQuery) {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `📥 **Exporting Your Expense Data**:\n\nYou can download complete reports (CSV or PDF) anytime:\n1. Click **Reports** in the sidebar or bottom navigation.\n2. Tap the **"Export CSV"** button at the top right of the Reports page to get your full itemized spreadsheet!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.2: Add Expense Intent (supports single and compound multi-item commands like "spent 100 on coffee , 100 on fuel on 26 aug")
    const numMatch = query.match(/(\d+)/);
    const isExplicitViewQuery = /^(show|view|how much|how many|what is|check|list|find|get)\b/i.test(query.trim());

    // Exploratory / advisory / question / calculation checks
    const hasOtherActionPrefix = /^(create|transfer|split|change|update|edit|go to|take me to|open|switch to|compare)/i.test(query.trim());
    const isQuestionOrAdvice = 
      /^(can i|could i|should i|would i|is it|is \d+|how to|how can|why|what if|explain|predict|tell me|suggest|give me|recommend|rule|tips|ways to|compare|who owes|settle)\b/i.test(query.trim()) ||
      /\b(50\s*30\s*20|50\/30\/20|rule 50|safe to spend|can i spend|budget advice|save money|financial tips|how to save|can i save|split \d+)\b/i.test(query) ||
      query.includes('?');

    const hasAddActionKeyword = /\b(spent|add|log|bought|paid|pay|bill|purchase|entry|record|deduct)\b/i.test(query);
    const hasCurrencySymbol = /(?:₹|rs\.?|inr)\s*\d+|\d+\s*(?:₹|rs\.?|inr|rupees)/i.test(query);
    const isDirectAddPattern = /^[a-zA-Z\s]+\s+\d+$/i.test(query.trim()) || /^\d+\s+[a-zA-Z\s]+$/i.test(query.trim());

    const isAddExpenseIntent = 
      Boolean(numMatch) && 
      !isExplicitViewQuery && 
      !isDeleteIntent && 
      !isQuestionOrAdvice &&
      !isThresholdQuery &&
      !hasOtherActionPrefix &&
      (hasAddActionKeyword || hasCurrencySymbol || isDirectAddPattern || query.includes(','));

    if (isAddExpenseIntent) {
      const { items, dateDisplayLabel } = parseMultiExpenses(query);

      if (items.length > 0) {
        if (currentWallets.length >= 2) {
          const isMulti = items.length > 1;
          const totalSum = items.reduce((s, i) => s + i.amount, 0);
          const summaryText = isMulti 
            ? `Which wallet should I add these **${items.length} expenses** (Total ₹${totalSum.toLocaleString('en-IN')})${dateDisplayLabel ? ` for **${dateDisplayLabel}**` : ''} to?`
            : `Which wallet should I add **${items[0].note} (₹${items[0].amount})**${dateDisplayLabel ? ` for **${dateDisplayLabel}**` : ''} to?`;

          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: summaryText,
            walletPrompt: {
              amount: items[0].amount,
              category: items[0].category,
              note: items[0].note,
              date: items[0].date,
              dateLabel: dateDisplayLabel,
              multiItems: items
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        } else if (currentWallets.length === 1) {
          try {
            const targetW = currentWallets[0];
            const targetWId = targetW.id || (targetW as any)._id;

            for (const item of items) {
              await api.addExpense({
                walletId: targetWId,
                amount: item.amount,
                category: item.category,
                note: item.note,
                date: item.date
              });
            }
            await fetchData(true);

            let confirmText = '';
            if (items.length === 1) {
              confirmText = `✅ Added ₹${items[0].amount} for "${items[0].note}" (${items[0].category})${dateDisplayLabel ? ` on ${dateDisplayLabel}` : ''} to "${targetW.name}" wallet!`;
            } else {
              confirmText = `✅ **Added ${items.length} Expenses**${dateDisplayLabel ? ` for **${dateDisplayLabel}**` : ''} to "${targetW.name}" wallet:\n\n`;
              items.forEach(it => {
                confirmText += `• ₹${it.amount} - "${it.note}" (${it.category})\n`;
              });
              const totalAmount = items.reduce((s, i) => s + i.amount, 0);
              confirmText += `\n💰 **Total Logged:** ₹${totalAmount.toLocaleString('en-IN')}`;
            }

            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              sender: 'ai',
              text: confirmText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          } catch (err: any) {
            alert(err.message || 'Failed to add expenses');
          }
        }
      }
    }

    // Check 1.6: Wallet Balances Query Intent
    const isWalletQuery = /\b(wallet balance|highest balance|which wallet|all wallets|wallet total|wallet list|my wallets|top wallet|total balance|my balance|how much money|total cash|net balance|current balance|available balance)\b/i.test(query);
    if (isWalletQuery && !isDeleteIntent && !isAddExpenseIntent) {
      let replyText = `👛 **Active Wallets & Balances**:\n\n`;
      const sortedWallets = [...currentWallets].sort((a, b) => b.balance - a.balance);
      
      sortedWallets.forEach((w, idx) => {
        const topBadge = idx === 0 ? ' 👑 (Highest Balance)' : '';
        replyText += `• **${w.name}**: ₹${w.balance.toLocaleString('en-IN')}${topBadge}\n`;
      });

      const totalBalance = currentWallets.reduce((sum, w) => sum + w.balance, 0);
      replyText += `\n💰 **Total Across Wallets**: ₹${totalBalance.toLocaleString('en-IN')}`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.7: Highest / Largest Expense Query Intent
    const isHighestExpenseQuery = /\b(highest expense|biggest spend|largest expense|max spend|top expense|biggest expense|highest item)\b/i.test(query);
    if (isHighestExpenseQuery && !isDeleteIntent && !isAddExpenseIntent) {
      if (validExpenses.length === 0) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `ℹ️ You haven't recorded any expenses yet!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      const topExp = [...validExpenses].sort((a, b) => b.amount - a.amount)[0];
      const walletName = currentWallets.find(w => String(w.id || (w as any)._id) === String(topExp.walletId))?.name || 'Wallet';

      let replyText = `🏆 **Highest Recorded Expense**:\n\n`;
      replyText += `- **Amount**: ₹${topExp.amount.toLocaleString('en-IN')}\n`;
      replyText += `- **Item**: ${topExp.note || topExp.category}\n`;
      replyText += `- **Category**: ${topExp.category}\n`;
      replyText += `- **Wallet**: ${walletName}\n`;
      replyText += `- **Date**: ${new Date(topExp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.8: Spending Velocity / Daily Average Intent
    const isVelocityQuery = /\b(spending velocity|velocity|how fast|daily average|burn rate|daily spend|average daily)\b/i.test(query);
    if (isVelocityQuery && !isDeleteIntent && !isAddExpenseIntent) {
      const now = new Date();
      const currentMonthExpenses = validExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });

      const totalThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const dayOfMonth = now.getDate();
      const dailyAverage = Math.round(totalThisMonth / (dayOfMonth || 1));
      const projectedMonth = dailyAverage * 30;

      let replyText = `⚡ **Your Spending Velocity Insights**:\n\n`;
      replyText += `• **Spent This Month**: ₹${totalThisMonth.toLocaleString('en-IN')}\n`;
      replyText += `• **Daily Average Pace**: ₹${dailyAverage.toLocaleString('en-IN')} / day\n`;
      replyText += `• **Projected Month End**: ₹${projectedMonth.toLocaleString('en-IN')}\n\n`;
      if (monthlyBudget > 0) {
        const percentUsed = Math.round((totalThisMonth / monthlyBudget) * 100);
        replyText += `📊 **Budget Usage**: ${percentUsed}% of your ₹${monthlyBudget.toLocaleString('en-IN')} monthly budget used.`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.85: Category Breakdown & Percentage Distribution Intent
    const isCategoryBreakdownQuery = /\b(category breakdown|top categories|category distribution|where is my money going|spending by category|categories summary)\b/i.test(query);
    if (isCategoryBreakdownQuery && !isDeleteIntent && !isAddExpenseIntent) {
      if (validExpenses.length === 0) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `ℹ️ No expenses recorded yet to analyze categories!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      const catMap: Record<string, number> = {};
      let totalAll = 0;
      validExpenses.forEach(e => {
        const cat = e.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + e.amount;
        totalAll += e.amount;
      });

      const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

      let replyText = `📊 **Category Spending Breakdown**:\n\n`;
      sortedCats.forEach(([cat, amt], idx) => {
        const percent = Math.round((amt / (totalAll || 1)) * 100);
        const topBadge = idx === 0 ? ' 👑 (Highest Spend)' : '';
        replyText += `• **${cat}**: ₹${amt.toLocaleString('en-IN')} (${percent}%)${topBadge}\n`;
      });
      replyText += `\n💰 **Total Expenditure**: ₹${totalAll.toLocaleString('en-IN')}`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.86: Safe to Spend / Daily Budget Advice Intent
    const isSafeToSpendQuery = /\b(safe to spend|can i spend|how much can i spend|budget advice|budget health|daily limit|available budget)\b/i.test(query);
    if (isSafeToSpendQuery && !isDeleteIntent && !isAddExpenseIntent) {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = daysInMonth - now.getDate() + 1;

      const totalBalance = currentWallets.reduce((sum, w) => sum + w.balance, 0);
      const safeDailyLimit = Math.max(0, Math.round(totalBalance / (daysRemaining || 1)));

      let replyText = `💡 **Financial Health & Safe-to-Spend Advice**:\n\n`;
      replyText += `• **Total Wallet Cash Available**: ₹${totalBalance.toLocaleString('en-IN')}\n`;
      replyText += `• **Days Remaining in Month**: ${daysRemaining} days\n`;
      replyText += `• **Recommended Daily Allowance**: ₹${safeDailyLimit.toLocaleString('en-IN')} / day\n\n`;

      const numMatch = query.match(/(\d+)/);
      if (numMatch) {
        const proposedAmount = Number(numMatch[1]);
        if (proposedAmount <= safeDailyLimit) {
          replyText += `✅ **Yes! Spending ₹${proposedAmount} is within your safe daily limit of ₹${safeDailyLimit}.**`;
        } else {
          replyText += `⚠️ **Caution**: Spending ₹${proposedAmount} exceeds your safe daily limit of ₹${safeDailyLimit}. Consider pacing your expenses.`;
        }
      } else {
        replyText += `Stay under ₹${safeDailyLimit} per day to keep your wallets healthy until the end of the month!`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.88: Trip Budgets & Group Status Intent
    const isTripQuery = /(^|\b)(trip|trips|vacation|tour|holiday)(\b|$)/i.test(query) && !isDeleteIntent && !isAddExpenseIntent;
    if (isTripQuery) {
      if (trips.length === 0) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `✈️ **No Active Trips Found**\n\nYou haven't created any trips yet. You can create a trip in the **Trips** tab to split bills and track shared vacation expenses with friends!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      let replyText = `✈️ **Active Trips Summary** (${trips.length} active):\n\n`;
      trips.forEach(t => {
        const budget = Number(t.totalBudget || (t as any).total_budget || 0);
        const spent = Number(t.spent || 0);
        const remaining = Math.max(0, budget - spent);
        const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        const size = t.groupSize || (t as any).group_size || (t.balances?.length || 1);
        replyText += `• **${t.name}**:\n  - Spent: ₹${spent.toLocaleString('en-IN')} / Budget: ₹${budget.toLocaleString('en-IN')} (${percent}% used)\n  - Remaining: ₹${remaining.toLocaleString('en-IN')}\n  - Members: ${size} people\n\n`;
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.89: Monthly Budget Health & Remaining Limit Intent
    const isBudgetStatusQuery = /\b(budget status|budget left|remaining budget|monthly budget|how much budget|budget remaining|over budget|my budget)\b/i.test(query) && !isDeleteIntent && !isAddExpenseIntent;
    if (isBudgetStatusQuery) {
      const now = new Date();
      const currentMonthExpenses = validExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      const totalMonthSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const remainingBudget = monthlyBudget > 0 ? monthlyBudget - totalMonthSpent : 0;
      const percentUsed = monthlyBudget > 0 ? Math.round((totalMonthSpent / monthlyBudget) * 100) : 0;
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = daysInMonth - now.getDate() + 1;
      const safeDailyLimit = remainingBudget > 0 ? Math.round(remainingBudget / (daysRemaining || 1)) : 0;

      let replyText = `🎯 **Monthly Budget Overview**:\n\n`;
      if (monthlyBudget > 0) {
        replyText += `• **Monthly Target**: ₹${monthlyBudget.toLocaleString('en-IN')}\n`;
        replyText += `• **Spent This Month**: ₹${totalMonthSpent.toLocaleString('en-IN')} (${percentUsed}% used)\n`;
        if (remainingBudget >= 0) {
          replyText += `• **Remaining Budget**: ₹${remainingBudget.toLocaleString('en-IN')}\n`;
          replyText += `• **Safe Daily Spend**: ₹${safeDailyLimit.toLocaleString('en-IN')} / day for next ${daysRemaining} days\n\n`;
          replyText += `✅ *You are well within your budget!*`;
        } else {
          replyText += `• **Over Budget By**: ⚠️ ₹${Math.abs(remainingBudget).toLocaleString('en-IN')}\n\n`;
          replyText += `⚠️ *You have exceeded your monthly limit. Pacing your discretionary spend is recommended.*`;
        }
      } else {
        replyText += `• **Spent This Month**: ₹${totalMonthSpent.toLocaleString('en-IN')}\n`;
        replyText += `ℹ️ You haven't set a monthly budget yet. You can set one in your **Profile & Settings** page to monitor monthly targets!`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.90: 50/30/20 Rule Financial Strategy Intent
    const is503020RuleQuery = /(^|\b)(50\s*30\s*20|50\/30\/20|rule 50)(\b|$)/i.test(query);
    if (is503020RuleQuery) {
      const totalBalance = currentWallets.reduce((s, w) => s + w.balance, 0);
      const baseAmount = monthlyBudget > 0 ? monthlyBudget : (totalBalance > 0 ? totalBalance : 50000);
      const needs = Math.round(baseAmount * 0.50);
      const wants = Math.round(baseAmount * 0.30);
      const savings = Math.round(baseAmount * 0.20);

      let replyText = `📐 **The 50/30/20 Budgeting Rule** (Tailored for you):\n\n`;
      replyText += `Based on your ${monthlyBudget > 0 ? `Monthly Budget (₹${monthlyBudget.toLocaleString('en-IN')})` : `Total Balance (₹${baseAmount.toLocaleString('en-IN')})`}:\n\n`;
      replyText += `• 🏠 **50% Needs (₹${needs.toLocaleString('en-IN')})**:\n  Rent, Groceries, Utilities, Bills, and Fuel/Transport.\n`;
      replyText += `• ☕ **30% Wants (₹${wants.toLocaleString('en-IN')})**:\n  Dining out, Shopping, Entertainment, and Coffee.\n`;
      replyText += `• 💰 **20% Savings (₹${savings.toLocaleString('en-IN')})**:\n  Emergency Fund, Investments, and Debt clearance.\n\n`;
      replyText += `💡 *ExpenseHub Tip: Track your categories to ensure your "Wants" don't exceed 30%!*`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.91: Savings Tips & Financial Advice Intent
    const isSavingsTipsQuery = /\b(tips|how to save|save money|can i save|reduce spending|financial advice|cut expenses|ways to save|how to reduce|how to cut)\b/i.test(query) && !isDeleteIntent && !isAddExpenseIntent;
    if (isSavingsTipsQuery) {
      const catMap: Record<string, number> = {};
      validExpenses.forEach(e => {
        const cat = e.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + e.amount;
      });
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

      let replyText = `💡 **Personalized Financial & Savings Tips**:\n\n`;
      if (topCat) {
        replyText += `1. 🎯 **Tackle Your #1 Category (${topCat[0]} - ₹${topCat[1].toLocaleString('en-IN')})**:\n   Your largest expense area is **${topCat[0]}**. Setting a dedicated wallet limit for ${topCat[0]} can save you up to 15-20% each month.\n\n`;
      }
      replyText += `2. 👛 **Use Multiple Wallets**:\n   Keep one wallet for essentials (Groceries, Bills) and another for discretionary spending (Dining, Shopping).\n\n`;
      replyText += `3. ⏳ **Apply the 24-Hour Rule**:\n   For any non-essential purchase above ₹1,000, wait 24 hours before buying to avoid impulse purchases.\n\n`;
      replyText += `4. ⚡ **Track Daily Spending Velocity**:\n   Ask me *"how fast am I spending?"* once a week to stay ahead of your month-end cash flow!`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.92: Recent Expenses & Today's Summary Intent
    const isRecentExpensesQuery = /\b(today|today's expenses|recent expenses|latest transactions|recent transactions|what did i spend today|latest expenses)\b/i.test(query) && !isDeleteIntent && !isAddExpenseIntent;
    if (isRecentExpensesQuery) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayExpenses = validExpenses.filter(e => e.date && e.date.startsWith(todayStr));

      let replyText = '';
      if (query.toLowerCase().includes('today')) {
        const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
        replyText = `📅 **Today's Expenses** (${todayExpenses.length} entries):\n\n`;
        if (todayExpenses.length > 0) {
          replyText += todayExpenses.map(e => `• ₹${e.amount.toLocaleString('en-IN')} - ${e.note || e.category} (${e.category})`).join('\n');
          replyText += `\n\n💰 **Total Today**: ₹${todayTotal.toLocaleString('en-IN')}`;
        } else {
          replyText += `No expenses recorded for today yet. You can log one by typing *"spent 50 coffee"*!`;
        }
      } else {
        const recent = validExpenses.slice(0, 5);
        replyText = `🕒 **Latest 5 Expenses**:\n\n`;
        if (recent.length > 0) {
          replyText += recent.map(e => `• ₹${e.amount.toLocaleString('en-IN')} - ${e.note || e.category} (${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`).join('\n');
        } else {
          replyText += `No expenses found in your account yet.`;
        }
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.925: Unified Spending & Filter Query Engine (e.g. "Show me the expenses", "show fuel expenses", "Show All Expenses in aug wallet this month")
    const isSpendingOrFilterQuery = 
      (/\b(show|view|how much|how many|list|check|find|get|breakdown|ledger)\b/i.test(query) ||
       /\b(all expenses|total spent|total expenses|spending on|spent on)\b/i.test(query) ||
       (/\b(fuel|grocery|groceries|coffee|food|rent|dining|shopping|medical|travel)\b/i.test(query) && /\b(spent|cost|expense|expenses|how much|show|view)\b/i.test(query))) &&
      !isDeleteIntent && 
      !isAddExpenseIntent;

    if (isSpendingOrFilterQuery) {
      // Extract optional wallet and timeframe parameters first
      const walletMatch = query.match(/in\s+(.*?)\s+wallet/i);
      let rawWalletName = walletMatch ? walletMatch[1].replace(/\(.*?\)/g, '').trim() : '';

      const timeframeMatch = query.match(/(this week|this month|all time)/i);
      const timeframe = timeframeMatch ? timeframeMatch[1].toLowerCase() : '';

      // Clean filler words, analytical terms, and punctuation from the query subject
      let rawSubject = query
        .replace(/in\s+.*?\s+wallet/gi, '')
        .replace(/\b(this week|this month|all time)\b/gi, '')
        .replace(/\b(show|view|find|check|get|details|breakdown|expenses|expense|how|much|many|did|i|my|you|we|spent|spend|spending|cost|on|for|in|total|all|the|a|an|please|tell|me|about|amount|value|velocity|is|what|which)\b/gi, '')
        .replace(/[?!.,]/g, '')
        .trim();

      const subject = (rawSubject.length > 1 && !/^(me|the|my|all|wallet|expenses|velocity|is|what)$/i.test(rawSubject))
        ? rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1)
        : 'All Expenses';

      // Base list filtered by subject using fuzzy keywords
      let matching = validExpenses;
      if (subject !== 'All Expenses') {
        const keywords = getCategoryKeywords(subject);
        matching = validExpenses.filter(e => {
          const noteLower = (e.note || '').toLowerCase();
          const catLower = (e.category || '').toLowerCase();
          return keywords.some(kw => noteLower.includes(kw) || catLower.includes(kw));
        });
      }

      // STEP 1: If user has NOT specified a wallet yet, ALWAYS prompt Step 1: Select Wallet First!
      if (!rawWalletName) {
        const totalAll = matching.reduce((sum, e) => sum + e.amount, 0);

        let replyText = `🤔 Step 1: Which Wallet do you want to view for "${subject}"?\n\n`;
        replyText += `Total Spent across active wallets: ₹${totalAll.toLocaleString('en-IN')} (${matching.length} transactions)\n\n`;
        replyText += `Select a Wallet option below to proceed:`;

        const walletOptions = [
          { label: `👛 All Active Wallets (₹${totalAll.toLocaleString('en-IN')})`, prompt: `Show ${subject} expenses in All Wallets` },
          ...currentWallets.map(w => {
            const wId = String(w.id || (w as any)._id);
            const wTotal = matching.filter(e => String(e.walletId) === wId).reduce((sum, e) => sum + e.amount, 0);
            return {
              label: `👛 ${w.name} (₹${wTotal.toLocaleString('en-IN')})`,
              prompt: `Show ${subject} expenses in ${w.name} wallet`
            };
          })
        ];

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          optionGroups: [
            { title: "Select Wallet First:", options: walletOptions }
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      // STEP 2 & 3: User HAS specified a wallet (e.g. "in aug wallet")
      let walletDisplayName = 'All Wallets';
      let targetWallet: any = null;

      if (rawWalletName.toLowerCase() !== 'all wallets') {
        const cleanSearch = rawWalletName.replace(/\(.*?\)/g, '').trim().toLowerCase();
        targetWallet = currentWallets.find(w => 
          w.name.toLowerCase() === cleanSearch ||
          w.name.toLowerCase().includes(cleanSearch) || 
          cleanSearch.includes(w.name.toLowerCase())
        );

        if (targetWallet) {
          walletDisplayName = targetWallet.name;
          const targetWId = String(targetWallet.id || (targetWallet as any)._id);
          matching = matching.filter(e => String(e.walletId) === targetWId);
        }
      }

      // Filter by timeframe if specified
      const now = new Date();
      if (timeframe === 'this week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        matching = matching.filter(e => new Date(e.date) >= startOfWeek);
      } else if (timeframe === 'this month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        matching = matching.filter(e => new Date(e.date) >= startOfMonth);
      }

      const totalAmount = matching.reduce((sum, e) => sum + e.amount, 0);

      let replyText = `📊 ${subject}`;
      if (walletDisplayName !== 'All Wallets') replyText += ` in "${walletDisplayName}" Wallet`;
      else replyText += ` in All Wallets`;
      if (timeframe) replyText += ` (${timeframe.toUpperCase()})`;
      replyText += `:\n\nTotal Spent: ₹${totalAmount.toLocaleString('en-IN')} (${matching.length} transactions)\n\n`;

      if (matching.length > 0) {
        replyText += matching.map(e => `• ₹${e.amount.toLocaleString('en-IN')} - ${e.note || e.category} (${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`).join('\n');
      } else {
        replyText += `No transactions found for this selection.`;
      }

      // If user specified wallet BUT hasn't specified timeframe yet, prompt STEP 2: Choose Period!
      if (!timeframe) {
        replyText += `\n\n🗓️ Step 2: Now select the Time Period for ${walletDisplayName !== 'All Wallets' ? `"${walletDisplayName}" Wallet` : 'All Wallets'}:`;
        const currentMonthName = new Date().toLocaleString('en-IN', { month: 'long' });
        const walletPart = targetWallet ? `in ${targetWallet.name} wallet ` : 'in All Wallets ';

        const periodOptions = [
          { label: `🗓️ This Week`, prompt: `Show ${subject} expenses ${walletPart}this week` },
          { label: `📅 ${currentMonthName} (This Month)`, prompt: `Show ${subject} expenses ${walletPart}this month` },
          { label: `♾️ All Time`, prompt: `Show ${subject} expenses ${walletPart}all time` }
        ];

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          optionGroups: [
            { title: `Select Time Period for ${walletDisplayName !== 'All Wallets' ? `"${walletDisplayName}" Wallet` : 'selection'}:`, options: periodOptions }
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 1.93: Greeting & Help Intent
    const isGreetingQuery = /^(hi|hello|hey|help|commands|what can you do|who created this|who made you|about)\b/i.test(query.trim());
    if (isGreetingQuery && !isDeleteIntent && !isAddExpenseIntent) {
      let replyText = `👋 **Hi there! I'm ExpenseHub AI**, your 24/7 financial assistant.\n\n`;
      replyText += `Here are things you can ask me:\n`;
      replyText += `• 📝 **Add Expenses**: *"spent 50 coffee yesterday"*, *"paid 200 petrol on 10 aug"*\n`;
      replyText += `• 🗑️ **Delete Expenses**: *"delete spent 50 coffee"*, *"remove 200 fuel"*\n`;
      replyText += `• 📊 **Check Spending**: *"how much i spent on grocery"*, *"show fuel expenses"*\n`;
      replyText += `• 👛 **Wallet Balances**: *"which wallet has highest balance"*, *"what is my total balance"*\n`;
      replyText += `• ⚡ **Velocity & Health**: *"how fast am i spending"*, *"safe to spend 500?"*\n`;
      replyText += `• 💡 **Advisory**: *"how to save money"*, *"explain 50 30 20 rule"*\n\n`;
      replyText += `💡 *Crafted with ❤️ for ExpenseHub by Mohamed Rashid.*`;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    setIsLoading(true);

    try {
      const historyForApi = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ sender: m.sender, text: m.text }));

      const contextData = {
        budget: { monthlyBudget, balance },
        wallets,
        expenses,
        trips,
        user: profile
      };

      const res = await api.askAIChat(query.trim(), historyForApi, contextData);

      if (res.expenseAdded) {
        await fetchData(true);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        walletPrompt: res.walletPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.warn('Backend AI unavailable, using intelligent financial assistant fallback:', err);
      const fallbackText = generateLocalFinancialAnswer(
        query.trim(),
        currentWallets,
        validExpenses,
        trips,
        monthlyBudget,
        profile
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const clearedMsg: ChatMessage[] = [
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: "Chat cleared! How else can I assist you with your finances?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(clearedMsg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedMsg));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[90vh] md:max-h-[82vh] w-full md:w-[480px] md:inset-x-auto md:right-6 md:bottom-6 bg-white/95 dark:bg-dark-surface/95 border border-gray-200 dark:border-white/10 rounded-t-[32px] md:rounded-3xl z-[101] flex flex-col shadow-2xl overflow-hidden backdrop-blur-3xl"
            >
              {/* Mobile Pull Handle Indicator */}
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />

              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple p-[2px] shadow-sm">
                    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[14px] flex items-center justify-center text-blue-600 dark:text-brand-neon">
                      <FiZap size={20} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-1.5">
                      ExpenseHub AI
                      <span className="text-[10px] font-bold bg-blue-100 dark:bg-brand-neon/20 text-blue-700 dark:text-brand-neon px-2 py-0.5 rounded-full uppercase tracking-wider">Gemini 3.6</span>
                    </h3>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-white/50">Your 24/7 Financial Advisor</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={handleClear}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                    title="Clear Chat"
                  >
                    <FiTrash2 size={16} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-hide">
                {messages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white dark:text-black font-semibold rounded-br-none shadow-md'
                          : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white/90 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* 1-Click Interactive Wallet Selection Buttons */}
                      {msg.walletPrompt && wallets.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-white/10 space-y-2">
                          <p className="text-[11px] font-bold text-gray-500 dark:text-white/60 uppercase tracking-wider">Select Wallet (1-Click):</p>
                          <div className="flex flex-wrap gap-2">
                            {wallets.map(w => (
                              <button
                                type="button"
                                key={w.id || (w as any)._id}
                                onClick={() => handleSelectWallet(msg.id, w, msg.walletPrompt!)}
                                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-brand-neon dark:to-brand-purple text-white dark:text-black font-bold text-xs rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                              >
                                👛 {w.name} (₹{w.balance.toLocaleString('en-IN')})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Timeframe Option Buttons */}
                      {msg.periodPrompts && msg.periodPrompts.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-white/10 space-y-2">
                          <p className="text-[11px] font-bold text-gray-500 dark:text-white/60 uppercase tracking-wider">Select Period Option (1-Click):</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.periodPrompts.map(p => (
                              <button
                                type="button"
                                key={p}
                                onClick={() => handleSend(p)}
                                className="px-3 py-2 bg-blue-50 dark:bg-white/10 hover:bg-blue-100 dark:hover:bg-white/20 border border-blue-200 dark:border-white/20 text-blue-700 dark:text-brand-neon font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                ⏱️ {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Grouped Option Buttons (Wallets & Time Periods) */}
                      {msg.optionGroups && msg.optionGroups.map((group, idx) => (
                        <div key={idx} className="mt-3 pt-2 border-t border-gray-200 dark:border-white/10 space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-500 dark:text-white/60 uppercase tracking-wider">{group.title}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.options.map(opt => (
                              <button
                                type="button"
                                key={opt.label}
                                onClick={() => handleSend(opt.prompt)}
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-brand-neon/15 dark:to-brand-purple/15 hover:from-blue-600/20 hover:to-purple-600/20 dark:hover:from-brand-neon/30 dark:hover:to-brand-purple/30 border border-blue-200 dark:border-white/20 text-blue-700 dark:text-brand-neon font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-white/30 mt-1 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl rounded-bl-none max-w-[120px]">
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-brand-neon animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-brand-neon animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-brand-neon animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0 border-t border-gray-100 dark:border-white/5">
                {quickPrompts.map(prompt => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full text-[11px] font-bold text-gray-600 dark:text-white/70 whitespace-nowrap transition-all shrink-0 cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <form 
                onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleSend(); }}
                className="p-3 sm:p-4 border-t border-gray-100 dark:border-white/10 flex gap-2 items-center flex-shrink-0 bg-gray-50/50 dark:bg-white/5"
              >
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Ask ExpenseHub AI..."
                  className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || isLoading}
                  className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white dark:text-black rounded-2xl shadow-md hover:shadow-lg disabled:opacity-40 transition-all shrink-0"
                >
                  <FiSend size={18} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
