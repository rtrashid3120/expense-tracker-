import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiPlus, FiMic, FiTrash2, FiLayers, FiList } from 'react-icons/fi';
import { useAppStore } from '../store';
import type { Category } from '../store';

interface MultiItemRow {
  id: string;
  name: string;
  amount: string;
  category: Category;
}

export function AddExpenseModal({ 
  isOpen, 
  onClose,
  initialCategory = 'Personal',
  initialTripId
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialCategory?: Category;
  initialTripId?: string;
}) {
  const { wallets, activeWalletId, trips, addExpense, createTrip } = useAppStore();
  
  // Mode state: 'single' or 'batch'
  const [entryMode, setEntryMode] = useState<'single' | 'batch'>('single');

  // Date state
  const todayStr = new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const yesterdayStr = getYesterdayStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Single item state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(initialCategory);
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState<string>('');
  const [tripId, setTripId] = useState<string>(initialTripId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Domain specific state
  const [liters, setLiters] = useState('');
  const [odometer, setOdometer] = useState('');
  const [familyMember, setFamilyMember] = useState('');
  const [claimStatus, setClaimStatus] = useState('None');
  const [isListening, setIsListening] = useState(false);

  // Multi-item batch state
  const [multiItems, setMultiItems] = useState<MultiItemRow[]>([
    { id: '1', name: '', amount: '', category: 'Groceries' },
    { id: '2', name: '', amount: '', category: 'Groceries' },
    { id: '3', name: '', amount: '', category: 'Groceries' },
  ]);
  const [openCategoryRowId, setOpenCategoryRowId] = useState<string | null>(null);
  
  // Category Domains state with persistence
  const defaultCategories: string[] = ['Personal', 'Groceries', 'Rent', 'Fuel', 'Medical', 'Travel'];
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_category_domains');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const categories = [...defaultCategories, ...customCategories];

  const handleAddMultiRow = () => {
    setMultiItems(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', amount: '', category: category || 'Groceries' }
    ]);
  };

  const handleRemoveMultiRow = (id: string) => {
    if (multiItems.length <= 1) return;
    setMultiItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMultiRowChange = (id: string, field: keyof MultiItemRow, value: string) => {
    setMultiItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'amount') {
          const raw = value.replace(/[^0-9]/g, '');
          const formatted = raw ? new Intl.NumberFormat('en-IN').format(parseInt(raw, 10)) : '';
          return { ...item, amount: formatted };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const getMultiItemsTotal = () => {
    return multiItems.reduce((sum, item) => {
      const parsed = parseFloat(item.amount.replace(/,/g, '')) || 0;
      return sum + parsed;
    }, 0);
  };

  const getValidMultiItemsCount = () => {
    return multiItems.filter(i => i.amount && parseFloat(i.amount.replace(/,/g, '')) > 0).length;
  };

  const handleSwitchWallet = () => {
    if (wallets.length <= 1) return;
    const currentIndex = wallets.findIndex(w => w.id === walletId);
    const nextIndex = (currentIndex + 1) % wallets.length;
    setWalletId(wallets[nextIndex].id);
  };

  const handleAddCustomCategory = () => {
    const name = window.prompt("Enter new Category Domain name (e.g. Chappals, Hotel, Food, Bike, Household):");
    if (!name || !name.trim()) return;
    
    const formattedName = name.trim();
    const categoryName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);

    if (!categories.some(c => c.toLowerCase() === categoryName.toLowerCase())) {
      const updated = [...customCategories, categoryName];
      setCustomCategories(updated);
      try {
        localStorage.setItem('custom_category_domains', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      setCategory(categoryName as any);
    } else {
      const existing = categories.find(c => c.toLowerCase() === categoryName.toLowerCase());
      if (existing) setCategory(existing as any);
    }
  };

  const handleAddCustomCategoryForBatch = (rowId: string) => {
    const name = window.prompt("Enter new Category Domain name (e.g. Chappals, Hotel, Food, Bike, Household):");
    if (!name || !name.trim()) return;
    
    const formattedName = name.trim();
    const categoryName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);

    if (!categories.some(c => c.toLowerCase() === categoryName.toLowerCase())) {
      const updated = [...customCategories, categoryName];
      setCustomCategories(updated);
      try {
        localStorage.setItem('custom_category_domains', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }

    const matchedCategory = categories.find(c => c.toLowerCase() === categoryName.toLowerCase()) || categoryName;
    handleMultiRowChange(rowId, 'category', matchedCategory as any);
  };

  const handleDeleteCustomCategory = (categoryName: string) => {
    if (defaultCategories.some(c => c.toLowerCase() === categoryName.toLowerCase())) {
      return;
    }

    const updated = customCategories.filter(c => c.toLowerCase() !== categoryName.toLowerCase());
    setCustomCategories(updated);
    try {
      localStorage.setItem('custom_category_domains', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (category.toLowerCase() === categoryName.toLowerCase()) {
      setCategory('Personal');
    }

    setMultiItems(prev => prev.map(item => 
      item.category.toLowerCase() === categoryName.toLowerCase() ? { ...item, category: 'Groceries' as any } : item
    ));
  };

  // Set default wallet and category when opened
  useEffect(() => {
    if (isOpen) {
      if (activeWalletId) setWalletId(activeWalletId);
      else if (wallets.length > 0) setWalletId(wallets[0].id);
      
      setCategory(initialCategory);
      if (initialTripId) {
        setTripId(initialTripId);
      } else if (trips.length > 0) {
        setTripId(trips[0].id);
      }
    }
  }, [isOpen, activeWalletId, wallets, initialCategory, initialTripId, trips]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      setAmount('');
      return;
    }
    // Parse into number and format with commas (Indian numbering system)
    const formatted = new Intl.NumberFormat('en-IN').format(parseInt(rawValue, 10));
    setAmount(formatted);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = multiItems.filter(item => item.amount && parseFloat(item.amount.replace(/,/g, '')) > 0);
    if (validItems.length === 0) {
      setErrorMsg('Please enter at least one item with an amount.');
      return;
    }

    const targetTripId = initialTripId || (category === 'Travel' ? tripId : undefined);

    if (wallets.length > 0 && !targetTripId && !walletId) {
      setErrorMsg('Please select a source wallet.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      for (const item of validItems) {
        const parsedAmount = parseFloat(item.amount.replace(/,/g, ''));
        const expenseData: any = {
          amount: parsedAmount,
          category: item.category,
          note: item.name || `${item.category} Expense`,
          walletId: targetTripId ? undefined : walletId,
          date: selectedDate,
          ...(targetTripId ? { tripId: targetTripId } : {})
        };
        await addExpense(expenseData);
      }
      
      // Reset & Close
      setMultiItems([
        { id: Date.now().toString() + '-1', name: '', amount: '', category: 'Groceries' },
        { id: Date.now().toString() + '-2', name: '', amount: '', category: 'Groceries' },
        { id: Date.now().toString() + '-3', name: '', amount: '', category: 'Groceries' }
      ]);
      setAmount(''); setNote('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save batch expenses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryMode === 'batch') {
      return handleBatchSubmit(e);
    }
    
    if (!amount) return;
    
    // Determine target trip
    const targetTripId = initialTripId || (category === 'Travel' ? tripId : undefined);

    if (wallets.length > 0 && !targetTripId && !walletId) {
      setErrorMsg('Please select a source wallet.');
      return;
    }
    if (category === 'Travel' && !targetTripId) {
      setErrorMsg('Please select a trip.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    // Remove commas before parsing to float
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));

    let expenseData: any = {
      amount: parsedAmount,
      category,
      note,
      walletId: targetTripId ? undefined : walletId,
      date: selectedDate
    };

    if (category === 'Fuel') {
      expenseData = { ...expenseData, liters: parseFloat(liters) || 0, odometer: parseFloat(odometer) || 0 };
    } else if (category === 'Medical') {
      expenseData = { ...expenseData, familyMember, claimStatus };
    }
    
    if (targetTripId) {
      expenseData.tripId = targetTripId;
    }

    try {
      await addExpense(expenseData);
      // Reset on success
      setAmount(''); setNote(''); setLiters(''); setOdometer(''); setFamilyMember(''); setCategory(initialCategory);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please use Google Chrome or Safari on desktop, or Chrome on Android.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMsg('');
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      
      const matchNumber = speechResult.match(/\d+/);
      if (matchNumber) {
        setAmount(new Intl.NumberFormat('en-IN').format(parseInt(matchNumber[0], 10)));
      }
      
      const text = speechResult;
      if (text.includes('grocery') || text.includes('groceries')) setCategory('Groceries');
      else if (text.includes('rent')) setCategory('Rent');
      else if (text.includes('fuel') || text.includes('petrol') || text.includes('gas')) setCategory('Fuel');
      else if (text.includes('medical') || text.includes('doctor') || text.includes('hospital') || text.includes('pharmacy')) setCategory('Medical');
      else if (text.includes('travel') || text.includes('trip')) setCategory('Travel');
      else setCategory('Personal');

      let noteStr = speechResult
        .replace(/add|spent|paid|for|rupees|rs/g, '')
        .replace(/\d+/g, '')
        .trim();
      
      if (noteStr) {
        setNote(noteStr.charAt(0).toUpperCase() + noteStr.slice(1));
      }
    };

    recognition.onerror = (event: any) => {
      setErrorMsg("Voice recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleCreateTrip = async () => {
    const name = window.prompt("Enter new trip name:");
    if (!name) return;
    const budgetStr = window.prompt("Enter total budget for trip:", "1000");
    const budget = budgetStr ? parseFloat(budgetStr) : 0;
    try {
      await createTrip({
        name,
        totalBudget: budget,
        groupSize: 1,
        image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80',
        balances: []
      });
    } catch (e: any) {
      alert(e.message || "Failed to create trip");
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 max-h-[90vh] md:max-h-[85vh] w-full md:w-[540px] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 bg-white/95 dark:bg-dark-surface/95 border-t border-gray-200 dark:border-white/10 rounded-t-[32px] md:rounded-3xl z-[101] p-4 sm:p-6 md:p-8 flex flex-col shadow-2xl backdrop-blur-3xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3 sm:mb-4 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add Expense</h2>
              <div className="flex gap-2 sm:gap-3">
                <button type="button" onClick={handleVoiceInput} className={`p-2.5 sm:p-3 border rounded-full transition-colors ${isListening ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 animate-pulse' : 'bg-blue-50 dark:bg-brand-neon/10 border-blue-200 dark:border-brand-neon/20 text-blue-600 dark:text-brand-neon hover:bg-blue-100 dark:hover:bg-brand-neon/20'}`}>
                  <FiMic size={18} />
                </button>
                <button onClick={onClose} className="p-2.5 sm:p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-2xl p-1 mb-4 flex-shrink-0 border border-gray-200 dark:border-white/10">
              <button 
                type="button"
                onClick={() => setEntryMode('single')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  entryMode === 'single'
                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FiList size={16} />
                Single Item
              </button>
              <button 
                type="button"
                onClick={() => setEntryMode('batch')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  entryMode === 'batch'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white shadow-md'
                    : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FiLayers size={16} />
                ⚡ Multi-Item Batch
              </button>
            </div>

            {entryMode === 'batch' ? (
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 scrollbar-hide pb-4">
                  {/* Source Wallet / Trip Selector */}
                  {initialTripId ? (
                    <div className="p-3.5 bg-brand-50 dark:bg-brand-neon/10 border border-brand-200 dark:border-brand-neon/30 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-brand-600 dark:text-brand-neon uppercase tracking-wider">Logging Batch For Trip</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">✈️ {trips.find(t => t.id === initialTripId)?.name || 'Current Trip'}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-brand-100 dark:bg-brand-neon/20 text-brand-700 dark:text-brand-neon px-2.5 py-1 rounded-full">Trip Mode</span>
                    </div>
                  ) : null}
                                 {/* Transaction Date Selector */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Transaction Date</label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(todayStr)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                          selectedDate === todayStr
                            ? 'bg-blue-600 dark:bg-brand-neon text-white dark:text-black border-transparent shadow-sm'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                      >
                        📅 Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(yesterdayStr)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                          selectedDate === yesterdayStr
                            ? 'bg-purple-600 dark:bg-brand-neon text-white dark:text-black border-transparent shadow-sm'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                      >
                        ⏪ Yesterday
                      </button>

                      <div className="shrink-0 flex items-center">
                        <input
                          type="date"
                          max={todayStr}
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-white rounded-xl px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon"
                        />
                      </div>
                    </div>
                  </div>

                  {!initialTripId && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Source Wallet</label>
                      <div className="flex gap-2">
                        <select 
                          value={walletId} 
                          onChange={(e) => setWalletId(e.target.value)}
                          className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon appearance-none text-sm"
                        >
                          {wallets.length === 0 && <option value="" className="bg-white dark:bg-dark-surface">No wallets available</option>}
                          {wallets.map(w => (
                            <option key={w.id} value={w.id} className="bg-white dark:bg-dark-surface">{w.name} (₹{w.balance.toLocaleString()})</option>
                          ))}
                        </select>
                        <button type="button" onClick={handleSwitchWallet} className="px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10" title="Switch wallet">
                          <FiPlus size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Multi-Item Inputs */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold text-gray-500 dark:text-white/60 uppercase tracking-wider">Items Table ({multiItems.length})</span>
                      <span className="text-xs font-black text-blue-600 dark:text-brand-neon">Total: ₹{getMultiItemsTotal().toLocaleString('en-IN')}</span>
                    </div>

                    {multiItems.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl space-y-2 relative group">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-gray-400 dark:text-white/30 w-4">{idx + 1}.</span>
                          <input 
                            type="text"
                            placeholder={idx === 0 ? "Milk" : idx === 1 ? "Curd" : idx === 2 ? "Rice" : "Item name"}
                            value={item.name}
                            onChange={(e) => handleMultiRowChange(item.id, 'name', e.target.value)}
                            className="flex-1 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon"
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                            <input 
                              type="text"
                              inputMode="numeric"
                              placeholder={idx === 0 ? "50" : idx === 1 ? "10" : idx === 2 ? "100" : "0"}
                              value={item.amount}
                              onChange={(e) => handleMultiRowChange(item.id, 'amount', e.target.value)}
                              className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-6 pr-2 py-2 text-sm font-black text-blue-600 dark:text-brand-neon outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon"
                            />
                          </div>
                          {multiItems.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveMultiRow(item.id)}
                              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                              title="Delete row"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1 relative">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase">Category:</span>
                          
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenCategoryRowId(openCategoryRowId === item.id ? null : item.id)}
                              className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-white/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              🏷️ {item.category} <span className="text-[10px] opacity-60">▼</span>
                            </button>

                            {openCategoryRowId === item.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setOpenCategoryRowId(null)} 
                                />
                                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#182035] border border-gray-200 dark:border-white/15 rounded-xl shadow-2xl z-50 p-1.5 min-w-[190px] space-y-1 max-h-52 overflow-y-auto scrollbar-hide">
                                  <div className="text-[9px] font-bold text-gray-400 dark:text-white/40 uppercase px-2 py-1">Select Category</div>
                                  {categories.map(c => {
                                    const isCustom = customCategories.some(cc => cc.toLowerCase() === c.toLowerCase());
                                    return (
                                      <div
                                        key={c}
                                        onClick={() => {
                                          handleMultiRowChange(item.id, 'category', c as any);
                                          setOpenCategoryRowId(null);
                                        }}
                                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                                          item.category === c 
                                            ? 'bg-blue-50 dark:bg-brand-neon/20 text-blue-700 dark:text-brand-neon' 
                                            : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10'
                                        }`}
                                      >
                                        <span>{c}</span>
                                        {isCustom && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteCustomCategory(c);
                                            }}
                                            className="w-4 h-4 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                            title="Delete category in 1 click"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>

                          {/* + Add New Category Button */}
                          <button
                            type="button"
                            onClick={() => handleAddCustomCategoryForBatch(item.id)}
                            className="p-1.5 bg-blue-50 dark:bg-brand-neon/10 hover:bg-blue-100 dark:hover:bg-brand-neon/20 border border-blue-200 dark:border-brand-neon/30 text-blue-600 dark:text-brand-neon rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                            title="Add New Category Domain"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button"
                    onClick={handleAddMultiRow}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-white/20 text-gray-600 dark:text-white/70 font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-xs flex items-center justify-center gap-2"
                  >
                    <FiPlus size={16} />
                    + Add Another Item
                  </button>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex-shrink-0">
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold mb-3 border border-red-200 dark:border-red-500/30">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || getValidMultiItemsCount() === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white py-4 rounded-2xl font-black text-base shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiCheck size={20} />
                        Save All ({getValidMultiItemsCount()} Items • ₹{getMultiItemsTotal().toLocaleString('en-IN')})
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 sm:space-y-6 scrollbar-hide pb-4">
                  {initialTripId ? (
                    <div className="p-3.5 sm:p-4 bg-brand-50 dark:bg-brand-neon/10 border border-brand-200 dark:border-brand-neon/30 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-neon uppercase tracking-wider">Logging Expense For Trip</p>
                        <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white mt-0.5">✈️ {trips.find(t => t.id === initialTripId)?.name || 'Current Trip'}</p>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold bg-brand-100 dark:bg-brand-neon/20 text-brand-700 dark:text-brand-neon px-2.5 py-1 rounded-full">Trip Mode</span>
                    </div>
                  ) : null}

                  {/* Transaction Date Selector */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Transaction Date</label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(todayStr)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                          selectedDate === todayStr
                            ? 'bg-blue-600 dark:bg-brand-neon text-white dark:text-black border-transparent shadow-sm'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                      >
                        📅 Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(yesterdayStr)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                          selectedDate === yesterdayStr
                            ? 'bg-purple-600 dark:bg-brand-neon text-white dark:text-black border-transparent shadow-sm'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                      >
                        ⏪ Yesterday
                      </button>

                      <div className="shrink-0 flex items-center">
                        <input
                          type="date"
                          max={todayStr}
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-white rounded-xl px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon"
                        />
                      </div>
                    </div>
                  </div>

                  {!initialTripId && category !== 'Travel' && (
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Source Wallet</label>
                        <div className="flex gap-2">
                          <select 
                            value={walletId} 
                            onChange={(e) => setWalletId(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 sm:py-4 px-4 font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon transition-all appearance-none text-sm"
                          >
                            {wallets.length === 0 && <option value="" className="bg-white dark:bg-dark-surface">No wallets available</option>}
                            {wallets.map(w => (
                              <option key={w.id} value={w.id} className="bg-white dark:bg-dark-surface">{w.name} (₹{w.balance.toLocaleString()})</option>
                            ))}
                          </select>
                          <button type="button" onClick={handleSwitchWallet} className="px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors" title="Switch between created wallets">
                            <FiPlus size={20} />
                          </button>
                        </div>
                      </div>
                    )}

                  <div>
                    <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl text-gray-400 dark:text-white/40 font-bold">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={handleAmountChange}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 text-2xl sm:text-4xl font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all placeholder-gray-300 dark:placeholder-white/20"
                        placeholder="0"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Category Domain</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {categories.map(cat => {
                        const isCustom = customCategories.some(c => c.toLowerCase() === cat.toLowerCase());
                        return (
                          <div key={cat} className="relative group shrink-0">
                            <button
                              type="button"
                              onClick={() => setCategory(cat as any)}
                              className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl whitespace-nowrap text-xs sm:text-sm font-bold transition-all border flex items-center gap-1.5 ${
                                category === cat 
                                  ? 'bg-blue-50 dark:bg-brand-neon/20 border-blue-600 dark:border-brand-neon text-blue-700 dark:text-brand-neon shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                                  : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white/80'
                              }`}
                            >
                              {cat}
                              {isCustom && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomCategory(cat);
                                  }}
                                  className="ml-1 w-4 h-4 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                                  title="Delete this custom category"
                                >
                                  ×
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-2xl flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
                        title="Add Custom Category Domain"
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>
                  </div>


                  {/* Dynamic Domain Forms */}
                  <AnimatePresence mode="popLayout">
                    {category === 'Fuel' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Liters</label>
                          <input type="number" value={liters} onChange={(e) => setLiters(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon placeholder-gray-400 dark:placeholder-white/30" placeholder="0.0" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Odometer</label>
                          <input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon placeholder-gray-400 dark:placeholder-white/30" placeholder="km" />
                        </div>
                      </motion.div>
                    )}

                    {category === 'Medical' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Family Member</label>
                          <input type="text" value={familyMember} onChange={(e) => setFamilyMember(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon placeholder-gray-400 dark:placeholder-white/30" placeholder="E.g., Mom" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Insurance Claim</label>
                          <select value={claimStatus} onChange={(e) => setClaimStatus(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon appearance-none">
                            <option className="bg-white dark:bg-dark-surface">None</option>
                            <option className="bg-white dark:bg-dark-surface">Pending</option>
                            <option className="bg-white dark:bg-dark-surface">Approved</option>
                            <option className="bg-white dark:bg-dark-surface">Rejected</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                    
                    {category === 'Groceries' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3.5 bg-blue-50 dark:bg-brand-neon/10 rounded-xl border border-blue-200 dark:border-brand-neon/30">
                        <p className="text-xs text-blue-600 dark:text-brand-neon font-bold flex items-center gap-1.5"><FiPlus /> Add Itemized Receipt</p>
                        <p className="text-[10px] text-gray-500 dark:text-white/50 mt-0.5">Item-level tracking helps calculate price inflation.</p>
                      </motion.div>
                    )}

                    {category === 'Travel' && !initialTripId && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-white/60 block mb-1">Select Trip</label>
                          <div className="flex gap-2">
                            <select 
                              value={tripId} 
                              onChange={(e) => setTripId(e.target.value)}
                              className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-3 font-bold text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon appearance-none"
                            >
                              {trips.length === 0 && <option value="" className="bg-white dark:bg-dark-surface">No trips available</option>}
                              {trips.map(t => (
                                <option key={t.id} value={t.id} className="bg-white dark:bg-dark-surface">{t.name}</option>
                              ))}
                            </select>
                            <button type="button" onClick={handleCreateTrip} className="px-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors">
                              <FiPlus size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="text-xs sm:text-sm font-bold text-gray-500 dark:text-white/60 block mb-2 uppercase tracking-wider">Note (Optional)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 sm:py-4 px-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-neon outline-none transition-all placeholder-gray-400 dark:placeholder-white/30"
                      placeholder="What was this for?"
                    />
                  </div>
                </div>

                {/* Fixed Bottom Action Area */}
                <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex-shrink-0">
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold mb-3 border border-red-200 dark:border-red-500/30">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-brand-neon dark:to-brand-purple text-white py-4 sm:py-5 rounded-[24px] sm:rounded-[28px] font-black text-base sm:text-lg shadow-md dark:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiCheck size={20} />
                        Save {category} Expense
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
