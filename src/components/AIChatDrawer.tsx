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
  walletPrompt?: { amount: number; category: string; note: string };
  periodPrompts?: string[];
  optionGroups?: OptionGroup[];
}

const STORAGE_KEY = 'expensehub_ai_chat_messages';

const quickPrompts = [
  'spent 50 coffee',
  'delete spent 50 coffee',
  'show fuel expenses',
  'how much i spent on grocery',
  'Which wallet has highest balance?'
];

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
        text: `👋 **Welcome to ExpenseHub AI!**\nYour 24/7 Executive Financial Assistant created by **Mohamed Rashid**.\n\n⚡ **How to use me efficiently:**\n• ➕ **Add Expenses:** Type \`spent 50 coffee\` or \`add cake 40\`\n• 🗑️ **Delete Expenses:** Type \`delete spent 50 coffee\` or \`remove petrol 250\`\n• 📊 **Smart Query & Filters:** Ask \`show fuel expenses\` and I will let you choose your preferred **Wallet** or **Time Period**!\n• 👛 **Multi-Wallet Support:** 1-Click buttons to choose your wallet!\n• 👑 **About App:** Ask me about Mohamed Rashid or ExpenseHub specialties!`,
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

  const handleSelectWallet = async (msgId: string, wallet: any, prompt: { amount: number; category: string; note: string }) => {
    try {
      const walletId = wallet.id || wallet._id;
      await api.addExpense({
        amount: prompt.amount,
        category: prompt.category,
        note: prompt.note,
        walletId
      });

      // Silent refetch without page loading spinner or re-mount
      await fetchData(true);

      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            walletPrompt: undefined,
            text: `✅ **Successfully Recorded in ${wallet.name}!**\n- **Amount:** ₹${prompt.amount}\n- **Category:** ${prompt.category}\n- **Item:** ${prompt.note}\n- **Wallet:** ${wallet.name}`
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

    // Check 1: Expense Deletion Intent (e.g. "delete spent 50 coffee", "remove coffee 50")
    const isDeleteIntent = /\b(delete|remove|cancel|undo|erase|drop)\b/i.test(query);
    if (isDeleteIntent) {
      const numMatch = query.match(/(\d+)/);
      const amount = numMatch ? Number(numMatch[1]) : null;
      let cleanNote = query.replace(/(\d+)/g, '').replace(/\b(delete|remove|cancel|undo|erase|drop|spent|add|log|bought|paid|on|for|rupees|rs|₹|expense|last|latest|item)\b/gi, '').trim();

      let target = expenses.find(e => {
        const matchAmount = amount ? e.amount === amount : true;
        const matchNote = cleanNote ? (e.note || '').toLowerCase().includes(cleanNote.toLowerCase()) : true;
        return matchAmount && matchNote;
      });

      if (!target && amount) {
        target = expenses.find(e => e.amount === amount);
      }

      if (target) {
        try {
          const targetId = target.id || (target as any)._id;
          await api.deleteExpense(targetId);
          await fetchData(true);

          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `✅ **Successfully Deleted Expense!**\n- **Item:** ${target.note || 'Expense'}\n- **Amount:** ₹${target.amount}\n- **Category:** ${target.category}`,
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
          text: `⚠️ **Couldn't find an expense to delete.**\nSearched for: ${cleanNote ? `"${cleanNote}"` : ''} ${amount ? `₹${amount}` : ''}\n\n*Tip: Check your Audit Trail for full item details or exact amounts.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }
    }

    // Check 1.5: Detailed Specific Filter Query (e.g. "Show Fuel expenses in aug wallet" or "Show Grocery expenses this week")
    const isSpecificFilterIntent = query.match(/Show\s+(.*?)\s+expenses(?:\s+in\s+(.*?)\s+wallet|\s+(this week|this month|all time))?/i);
    if (isSpecificFilterIntent && (query.toLowerCase().includes('in ') || query.toLowerCase().includes('this ') || query.toLowerCase().includes('all time'))) {
      const subject = isSpecificFilterIntent[1].trim();
      const walletName = isSpecificFilterIntent[2]?.trim();
      const timeframe = isSpecificFilterIntent[3]?.toLowerCase();

      const k = subject.toLowerCase();
      let list = expenses.filter(e => (e.note && e.note.toLowerCase().includes(k)) || e.category.toLowerCase().includes(k));

      if (walletName && walletName.toLowerCase() !== 'all wallets') {
        const foundWallet = wallets.find(w => w.name.toLowerCase().includes(walletName.toLowerCase()));
        if (foundWallet) {
          const targetWId = foundWallet.id || (foundWallet as any)._id;
          list = list.filter(e => e.walletId === targetWId);
        }
      }

      const now = new Date();
      if (timeframe === 'this week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        list = list.filter(e => new Date(e.date) >= startOfWeek);
      } else if (timeframe === 'this month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        list = list.filter(e => new Date(e.date) >= startOfMonth);
      }

      const totalAmount = list.reduce((sum, e) => sum + e.amount, 0);

      let replyText = `📊 **${subject} Expenses** ${walletName ? `in **${walletName}**` : ''} ${timeframe ? `(${timeframe.toUpperCase()})` : ''}:\n\n`;
      replyText += `Total Spent: **₹${totalAmount.toLocaleString('en-IN')}** (${list.length} transactions)\n\n`;
      if (list.length > 0) {
        replyText += list.map(e => `• **₹${e.amount.toLocaleString('en-IN')}** - ${e.note || e.category} (${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`).join('\n');
      } else {
        replyText += `*No transactions found for this selection.*`;
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

    // Check 1.8: General Spending / Category Inquiry (e.g. "show fuel expenses", "how much i spent on grocery")
    const isSpendingQuery = /\b(show|view|how much|how many|spending|spent|cost|fuel|grocery|groceries|coffee|food|rent|dining)\b/i.test(query) && !isDeleteIntent;
    const cleanSubject = query
      .replace(/\b(show|view|find|check|get|details|breakdown|expenses|expense|how|much|many|did|i|my|you|we|spent|spend|spending|cost|on|for|in|total|all|the|a|an|please|tell|me|about|amount|value)\b/gi, '')
      .trim();

    if (isSpendingQuery && cleanSubject.length > 1) {
      const k = cleanSubject.toLowerCase();
      const matching = expenses.filter(e => 
        (e.note && e.note.toLowerCase().includes(k)) || 
        e.category.toLowerCase().includes(k)
      );

      const totalAll = matching.reduce((sum, e) => sum + e.amount, 0);
      const formattedSubject = cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1);
      const currentMonthName = new Date().toLocaleString('en-IN', { month: 'long' });

      let replyText = `🤔 **Which Wallet or Period do you want to view for "${formattedSubject}"?**\n\n`;
      replyText += `Total All-Time Spent: **₹${totalAll.toLocaleString('en-IN')}** (${matching.length} transactions)\n\n`;
      replyText += `Choose a **Wallet** or **Timeframe** option below to view exact details:`;

      const walletOptions = [
        { label: `👛 All Wallets (₹${totalAll.toLocaleString('en-IN')})`, prompt: `Show ${formattedSubject} expenses in All Wallets` },
        ...wallets.map(w => {
          const wId = w.id || (w as any)._id;
          const wTotal = matching.filter(e => e.walletId === wId).reduce((sum, e) => sum + e.amount, 0);
          return {
            label: `👛 ${w.name} (₹${wTotal.toLocaleString('en-IN')})`,
            prompt: `Show ${formattedSubject} expenses in ${w.name} wallet`
          };
        })
      ];

      const periodOptions = [
        { label: `🗓️ This Week`, prompt: `Show ${formattedSubject} expenses this week` },
        { label: `📅 ${currentMonthName} (This Month)`, prompt: `Show ${formattedSubject} expenses this month` },
        { label: `♾️ All Time`, prompt: `Show ${formattedSubject} expenses all time` }
      ];

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        optionGroups: [
          { title: "Select Wallet:", options: walletOptions },
          { title: "Select Time Period:", options: periodOptions }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    // Check 2: Instant 1-Click Wallet Selector Check for 2+ Wallets
    const numMatch = query.match(/(\d+)/);
    if (numMatch && wallets.length >= 2) {
      const amount = Number(numMatch[1]);
      let note = query.replace(/(\d+)/g, '').replace(/\b(spent|add|log|bought|paid|on|for|rupees|rs|₹)\b/gi, '').trim();
      if (!note) note = 'Expense';

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Which wallet should I add **${note} (₹${amount})** to?`,
        walletPrompt: { amount, category: 'Dining', note },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
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
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ Sorry, I encountered an issue: ${err.message || 'Unable to connect to AI service'}. Please try again!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
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
              className="fixed inset-x-0 bottom-0 max-h-[88vh] md:max-h-[82vh] w-full md:w-[480px] md:inset-x-auto md:right-6 md:bottom-6 bg-white/95 dark:bg-dark-surface/95 border border-gray-200 dark:border-white/10 rounded-t-[32px] md:rounded-3xl z-[101] flex flex-col shadow-2xl overflow-hidden backdrop-blur-3xl"
            >
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
  );
}
