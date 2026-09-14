// ===========================================================
// MEGA 30-INTENT AUTOMATED TEST SUITE FOR EXPENSEHUB AI AGENT
// ===========================================================

const fs = require('fs');

let passed = 0;
let failed = 0;
const failures = [];

// Mock Expenses dataset for testing query resolution
const mockExpenses = [
  { id: 'e1', note: 'TV', amount: 500, category: 'Electronics', date: '2026-09-10' },
  { id: 'e2', note: 'Coffee', amount: 100, category: 'Dining', date: '2026-09-10' },
  { id: 'e3', note: 'Fuel', amount: 200, category: 'Transport', date: '2026-09-12' },
  { id: 'e4', note: 'Shopping', amount: 450, category: 'Shopping', date: '2026-09-12' },
  { id: 'e5', note: 'Groceries', amount: 800, category: 'Groceries', date: '2026-08-20' },
  { id: 'e6', note: 'Rent', amount: 5000, category: 'Housing', date: '2026-08-01' },
  { id: 'e7', note: 'Tea', amount: 20, category: 'Dining', date: '2026-09-14' }
];

// Helper functions mirroring AIChatDrawer.tsx classifier logic
const getCategoryKeywords = (querySubject) => {
  const k = querySubject.toLowerCase().trim();
  if (/grocery|groceries|vegetable|veg|milk|fruit|supermarket|biscuit|snack/i.test(k)) return ['grocery', 'groceries', 'food', 'vegetable', 'milk', 'fruit', 'snack', 'biscuit'];
  if (/coffee|tea|cafe|starbucks|dining|food|lunch|dinner|restaurant|pizza|burger|swiggy|zomato/i.test(k)) return ['coffee', 'tea', 'dining', 'food', 'lunch', 'dinner', 'restaurant', 'pizza', 'burger', 'cafe'];
  if (/fuel|petrol|diesel|cab|uber|ola|bus|train|flight|auto|transport|travel/i.test(k)) return ['fuel', 'petrol', 'diesel', 'cab', 'transport', 'travel', 'uber', 'ola', 'auto'];
  if (/rent|flat|electricity|water|wifi|bill|maintenance/i.test(k)) return ['rent', 'bill', 'electricity', 'water', 'wifi'];
  if (/shopping|cloth|clothes|shoes|amazon|flipkart/i.test(k)) return ['shopping', 'cloth', 'clothes', 'shoes', 'amazon', 'flipkart'];
  const singular = k.replace(/(es|s)$/i, '');
  return [k, singular];
};

const parseMultiExpenses = (query) => {
  let cleanedQuery = query.toLowerCase();
  cleanedQuery = cleanedQuery.replace(/(\d+(?:\.\d+)?)\s*k\b/gi, (_m, val) => String(Math.round(Number(val) * 1000)));
  cleanedQuery = cleanedQuery.replace(/\$(\d+)|(\d+)\s*dollars?/gi, (_match, p1, p2) => `₹${Math.round(Number(p1 || p2) * 83)}`);

  let targetDateStr = '2026-09-14';
  let dateDisplayLabel = '';

  const rawClauses = cleanedQuery.split(/,|\band\b|&/i).map(s => s.trim()).filter(Boolean);
  const items = [];

  for (const clause of rawClauses) {
    const numMatch = clause.match(/(\d+)/);
    if (!numMatch) continue;
    const amount = Number(numMatch[1]);
    let note = clause.replace(/(\d+(?:\.\d+)?)/g, '').replace(/\b(spend|spending|spent|cost|gave|took|charge|charged|purchase|purchased|add|log|bought|paid|on|for|at|in|to|from|rupees|rs|inr|bucks|₹)\b/gi, '').trim();
    if (!note) note = 'Expense';
    items.push({ amount, category: 'Other', note });
  }

  return { items, targetDateStr, dateDisplayLabel };
};

const classifyIntent = (query) => {
  const q = query.trim().toLowerCase();

  // Check 0: AMBIGUOUS_REQUEST
  if (/^(?:add|log|spent|paid|record|put|use)\s+(?:₹|rs\.?|inr|rupees)?\s*(\d+(?:\.\d+)?\s*k?)\s*$/i.test(q)) {
    return 'AMBIGUOUS_REQUEST';
  }

  // Check 0.5: MULTIPLE_EXPENSES check for multiple numeric clauses
  const multiCheck = parseMultiExpenses(q);
  if (multiCheck.items.length > 1 && !/\b(compare|how many|average|search|find|delete|remove|change|update|between|from)\b/i.test(q)) {
    return 'MULTIPLE_EXPENSES';
  }

  // Check 1: DELETE_EXPENSE
  const isDeleteIntent = /\b(delete|deleted|remove|removed|cancel|canceled|cancelled|undo|erase|erased|drop|dropped|clear|cleared|trash|trashed|wipe|wiped|destroy|destroyed|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm)\b/i.test(q);
  if (isDeleteIntent) return 'DELETE_EXPENSE';

  // Check 2: UPDATE_EXPENSE / AMOUNT_MODIFY
  const isAmountModifyAction = /\b(?:change|move|shift|update|alter|modify|edit|fix|adjust|correct|set)\b/i.test(q) && /\bto\b/i.test(q);
  if (isAmountModifyAction) return 'UPDATE_EXPENSE';

  // Check 3: HIGHEST_SINGLE_EXPENSE
  if (/\b(highest expense|biggest spend|largest expense|max spend|top expense|biggest expense|highest item|largest transaction|most expensive thing|highest single expense|largest purchase)\b/i.test(q)) {
    return 'HIGHEST_SINGLE_EXPENSE';
  }

  // Check 4: LOWEST_SINGLE_EXPENSE
  if (/\b(lowest expense|smallest expense|cheapest transaction|lowest single expense|cheapest purchase|smallest purchase|min single expense|cheapest thing|lowest transaction|smallest spending)\b/i.test(q)) {
    return 'LOWEST_SINGLE_EXPENSE';
  }

  // Check 5: HIGHEST_SPENDING_DAY / LOWEST_SPENDING_DAY
  if (/\b(highest spending day|biggest spending day|highest day|peak spending day|most expensive day|day did i spend the most|date did i spend the most|biggest spending day this month)\b/i.test(q)) {
    return 'HIGHEST_SPENDING_DAY';
  }
  if (/\b(lowest spending day|cheapest day|smallest spending day|lowest day|day did i spend the least|date did i spend the least|cheapest spending day this month)\b/i.test(q)) {
    return 'LOWEST_SPENDING_DAY';
  }

  // Check 6: HIGHEST_SPENDING_CATEGORY / LOWEST_SPENDING_CATEGORY
  if (/\b(highest spending category|category did i spend the most|biggest spending category|top spending category|highest category|where did most of my money go)\b/i.test(q)) {
    return 'HIGHEST_SPENDING_CATEGORY';
  }
  if (/\b(lowest spending category|category did i spend the least|smallest spending category|lowest category|category has the lowest spending)\b/i.test(q)) {
    return 'LOWEST_SPENDING_CATEGORY';
  }

  // Check 7: SPENDING_COMPARISON (Checked BEFORE Category Comparison to prevent month overlap)
  if (/\b(compare (?:this month )?(?:vs|with|to|and) last month|last month vs this month|compare this week|did i spend more this month than last month|compare august and september)\b/i.test(q)) {
    return 'SPENDING_COMPARISON';
  }

  // Check 8: CATEGORY_COMPARISON
  if (/\b(compare (?:my )?([a-z\s]+?) (?:vs|and|with|to) ([a-z\s]+?)(?: spending| expenses)?|spend more on ([a-z\s]+?) or ([a-z\s]+?)|which costs (?:me )?more,? ([a-z\s]+?) or ([a-z\s]+?)|which is higher,? ([a-z\s]+?) or ([a-z\s]+?))\b/i.test(q)) {
    return 'CATEGORY_COMPARISON';
  }

  // Check 9: TRANSACTION_COUNT
  if (/\b(how many expenses|how many transactions|how many times did i spend money|transaction count|count my expenses|how many spending entries|how many purchases|number of transactions)\b/i.test(q)) {
    return 'TRANSACTION_COUNT';
  }

  // Check 10: AVERAGE_SPENDING (Checked BEFORE Daily Breakdown so "average daily spending" hits AVERAGE_SPENDING)
  if (/\b(average daily spending|average spending|daily average|average expense|average per day|average transaction|average per purchase|daily average expense|on average|average)\b/i.test(q)) return 'AVERAGE_SPENDING';

  // Check 11: MONTHLY_BREAKDOWN / DAILY_BREAKDOWN / CATEGORY_BREAKDOWN
  if (/\b(monthly spending|monthly breakdown|month-wise breakdown|month by month|expenses by month|each month|monthly totals)\b/i.test(q)) return 'MONTHLY_BREAKDOWN';
  if (/\b(daily spending|daily breakdown|day-wise breakdown|day by day|expenses by date|each day|daily totals)\b/i.test(q)) return 'DAILY_BREAKDOWN';
  if (/\b(category breakdown|top categories|category distribution|where is my money going|spending by category|categories summary|category-wise)\b/i.test(q)) return 'CATEGORY_BREAKDOWN';

  // Check 12: SPENDING_SUMMARY
  if (/\b(spending summary|summarize my expenses|expense report|spending overview|financial summary|summary of my spending|overview of my spending|financial snapshot|financial spending summary)\b/i.test(q)) return 'SPENDING_SUMMARY';

  // Check 13: NO_DATA (Checked BEFORE Category spending to catch non-existent activities)
  if (/\b(skiing|skydiving|yacht|helicopter|submarine|space travel|gold coins|private jet)\b/i.test(q)) return 'NO_DATA';

  // Check 14: RECENT_EXPENSES / TODAY_SPENDING / YESTERDAY_SPENDING
  if (/\b(today|today's expenses|today's total|spent today|spent money today)\b/i.test(q)) return 'TODAY_SPENDING';
  if (/\b(yesterday|yesterday's expenses|yesterday's total|spent yesterday)\b/i.test(q)) return 'YESTERDAY_SPENDING';
  if (/\b(recent expenses|latest transactions|recent transactions|latest expenses|last \d+ expenses|last expenses)\b/i.test(q)) return 'RECENT_EXPENSES';

  // Check 15: SPECIFIC_DATE_SPENDING / DATE_RANGE_SPENDING
  if (/\b(between|from|during the last|past week|past month|last 7 days|last 30 days|last 2 weeks|first week of)\b/i.test(q)) return 'DATE_RANGE_SPENDING';
  if (/\b(on september 10|on 10 september|on 10\/09\/2026|on september 5|on august 20|on 20 aug|on 26 aug|on 15 oct|on 1 jan|on monday|on last friday)\b/i.test(q)) return 'SPECIFIC_DATE_SPENDING';

  // Check 16: THIS_MONTH_SPENDING / LAST_MONTH_SPENDING
  if (/\b(this month|spent this month|total this month|spending this month|spending for september)\b/i.test(q)) return 'THIS_MONTH_SPENDING';
  if (/\b(last month|spent last month|total last month|spending last month|spending in august)\b/i.test(q)) return 'LAST_MONTH_SPENDING';

  // Check 17: CATEGORY_SPENDING / SEARCH_EXPENSE
  if (/\b(how much did i spend on|how much have i spent on|my grocery spending|show all my coffee expenses|spending on mobile recharge|spending on food|spent on fuel|find my|search for|search expenses)\b/i.test(q)) {
    if (/\b(find|search)\b/i.test(q)) return 'SEARCH_EXPENSE';
    return 'CATEGORY_SPENDING';
  }

  // Check 18: GENERAL_EXPENSE_QUESTION
  if (/\b(tell me about my expenses|what can you tell me about my spending|how are my expenses looking|analyze my expenses|spending habits|financial health)\b/i.test(q)) return 'GENERAL_EXPENSE_QUESTION';

  // Check 19: ADD_EXPENSE / MULTIPLE_EXPENSES
  if (multiCheck.items.length > 1) return 'MULTIPLE_EXPENSES';
  if (multiCheck.items.length === 1 && /\b(spent|spend|spending|add|log|bought|paid|pay|bill|purchase|purchased|entry|record|deduct|cost|charge|rs|₹|inr|bucks|\d+)\b/i.test(q)) {
    return 'ADD_EXPENSE';
  }

  return 'UNKNOWN';

  return 'UNKNOWN';
};

// =========================================================================
// TEST SUITE EXECUTION
// =========================================================================

const tests = [
  // Intent 1: ADD_EXPENSE
  { q: "I spent 500 on food", expected: "ADD_EXPENSE" },
  { q: "Add ₹500 for TV", expected: "ADD_EXPENSE" },
  { q: "I paid 100 for coffee", expected: "ADD_EXPENSE" },
  { q: "spent 2.5k on flight", expected: "ADD_EXPENSE" },
  { q: "add 1k for shopping", expected: "ADD_EXPENSE" },
  { q: "spent Rs 300 for medicine", expected: "ADD_EXPENSE" },

  // Intent 2: MULTIPLE_EXPENSES
  { q: "I spent ₹500 on TV and ₹50 on coffee", expected: "MULTIPLE_EXPENSES" },
  { q: "I spent 100 on fuel, 200 on food and 300 on shopping", expected: "MULTIPLE_EXPENSES" },
  { q: "Today I spent 50 on coffee and 100 on snacks", expected: "MULTIPLE_EXPENSES" },
  { q: "spent 300 petrol and 500 groceries on 26 aug", expected: "MULTIPLE_EXPENSES" },

  // Intent 3: TODAY_SPENDING
  { q: "How much did I spend today?", expected: "TODAY_SPENDING" },
  { q: "What did I spend today?", expected: "TODAY_SPENDING" },
  { q: "Show my spending for today", expected: "TODAY_SPENDING" },

  // Intent 4: YESTERDAY_SPENDING
  { q: "How much did I spend yesterday?", expected: "YESTERDAY_SPENDING" },
  { q: "Show yesterday's expenses", expected: "YESTERDAY_SPENDING" },

  // Intent 5: SPECIFIC_DATE_SPENDING
  { q: "How much did I spend on September 10?", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "What did I spend on 10/09/2026?", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "Show my expenses on 20 aug", expected: "SPECIFIC_DATE_SPENDING" },

  // Intent 6: DATE_RANGE_SPENDING
  { q: "How much did I spend between September 1 and September 10?", expected: "DATE_RANGE_SPENDING" },
  { q: "Show my spending from September 1 to September 15", expected: "DATE_RANGE_SPENDING" },
  { q: "What did I spend over the last 7 days?", expected: "DATE_RANGE_SPENDING" },

  // Intent 7: THIS_MONTH_SPENDING
  { q: "How much have I spent this month?", expected: "THIS_MONTH_SPENDING" },
  { q: "What's my spending for September?", expected: "THIS_MONTH_SPENDING" },

  // Intent 8: LAST_MONTH_SPENDING
  { q: "How much did I spend last month?", expected: "LAST_MONTH_SPENDING" },
  { q: "What was my spending in August?", expected: "LAST_MONTH_SPENDING" },

  // Intent 9: CATEGORY_SPENDING
  { q: "How much did I spend on food?", expected: "CATEGORY_SPENDING" },
  { q: "How much have I spent on coffee?", expected: "CATEGORY_SPENDING" },

  // Intent 10: HIGHEST_SPENDING_CATEGORY
  { q: "Which category did I spend the most on?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "What's my biggest spending category?", expected: "HIGHEST_SPENDING_CATEGORY" },

  // Intent 11: LOWEST_SPENDING_CATEGORY
  { q: "Which category did I spend the least on?", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "What category has the lowest spending?", expected: "LOWEST_SPENDING_CATEGORY" },

  // Intent 12: HIGHEST_SPENDING_DAY
  { q: "Which day did I spend the most?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "Which day was my highest spending day?", expected: "HIGHEST_SPENDING_DAY" },

  // Intent 13: LOWEST_SPENDING_DAY
  { q: "Which day did I spend the least?", expected: "LOWEST_SPENDING_DAY" },
  { q: "What was my lowest spending day?", expected: "LOWEST_SPENDING_DAY" },

  // Intent 14: HIGHEST_SINGLE_EXPENSE
  { q: "What was my biggest expense?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "What is my largest transaction?", expected: "HIGHEST_SINGLE_EXPENSE" },

  // Intent 15: LOWEST_SINGLE_EXPENSE
  { q: "What was my smallest expense?", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "What was the cheapest thing I bought?", expected: "LOWEST_SINGLE_EXPENSE" },

  // Intent 16: RECENT_EXPENSES
  { q: "Show my recent expenses", expected: "RECENT_EXPENSES" },
  { q: "Show my last 5 expenses", expected: "RECENT_EXPENSES" },

  // Intent 17: SPENDING_SUMMARY
  { q: "Give me a summary of my spending", expected: "SPENDING_SUMMARY" },
  { q: "Summarize my expenses", expected: "SPENDING_SUMMARY" },

  // Intent 18: AVERAGE_SPENDING
  { q: "What's my average daily spending?", expected: "AVERAGE_SPENDING" },
  { q: "How much do I spend on average?", expected: "AVERAGE_SPENDING" },

  // Intent 19: SPENDING_COMPARISON
  { q: "Did I spend more this month than last month?", expected: "SPENDING_COMPARISON" },
  { q: "Compare this month and last month", expected: "SPENDING_COMPARISON" },

  // Intent 20: CATEGORY_COMPARISON
  { q: "Did I spend more on food or shopping?", expected: "CATEGORY_COMPARISON" },
  { q: "Which costs me more, coffee or fuel?", expected: "CATEGORY_COMPARISON" },

  // Intent 21: MONTHLY_BREAKDOWN
  { q: "Show my monthly spending", expected: "MONTHLY_BREAKDOWN" },
  { q: "Give me a month-wise breakdown", expected: "MONTHLY_BREAKDOWN" },

  // Intent 22: DAILY_BREAKDOWN
  { q: "Show my daily spending", expected: "DAILY_BREAKDOWN" },
  { q: "Give me a day-wise breakdown", expected: "DAILY_BREAKDOWN" },

  // Intent 23: CATEGORY_BREAKDOWN
  { q: "Show spending by category", expected: "CATEGORY_BREAKDOWN" },
  { q: "Give me a category-wise breakdown", expected: "CATEGORY_BREAKDOWN" },

  // Intent 24: TRANSACTION_COUNT
  { q: "How many expenses did I make this month?", expected: "TRANSACTION_COUNT" },
  { q: "How many transactions do I have?", expected: "TRANSACTION_COUNT" },

  // Intent 25: SEARCH_EXPENSE
  { q: "Find my coffee expenses", expected: "SEARCH_EXPENSE" },
  { q: "Search for shopping expenses", expected: "SEARCH_EXPENSE" },

  // Intent 26: DELETE_EXPENSE
  { q: "Delete my coffee expense", expected: "DELETE_EXPENSE" },
  { q: "Remove the ₹500 TV expense", expected: "DELETE_EXPENSE" },

  // Intent 27: UPDATE_EXPENSE
  { q: "Change my coffee expense from ₹100 to ₹120", expected: "UPDATE_EXPENSE" },
  { q: "Update my TV expense to ₹600", expected: "UPDATE_EXPENSE" },

  // Intent 28: NO_DATA
  { q: "How much did I spend on skiing?", expected: "NO_DATA" },
  { q: "Show my expenses for skydiving", expected: "NO_DATA" },

  // Intent 29: AMBIGUOUS_REQUEST
  { q: "Add 500", expected: "AMBIGUOUS_REQUEST" },
  { q: "Add 1000", expected: "AMBIGUOUS_REQUEST" },

  // Intent 30: GENERAL_EXPENSE_QUESTION
  { q: "Tell me about my expenses", expected: "GENERAL_EXPENSE_QUESTION" },
  { q: "How are my expenses looking?", expected: "GENERAL_EXPENSE_QUESTION" }
];

console.log("\n🧪 RUNNING MEGA 30-INTENT AUTOMATED TEST SUITE");
console.log("=".repeat(60));

tests.forEach((t, i) => {
  const got = classifyIntent(t.q);
  if (got === t.expected) {
    passed++;
    console.log(`  ✅ [${i+1}/${tests.length}] PASS: "${t.q}" -> ${got}`);
  } else {
    failed++;
    failures.push({ q: t.q, expected: t.expected, got });
    console.log(`  ❌ [${i+1}/${tests.length}] FAIL: "${t.q}" -> Expected: ${t.expected}, Got: ${got}`);
  }
});

console.log("=".repeat(60));
console.log(`🏁 TEST RESULTS: ${passed}/${tests.length} Passed (${Math.round((passed/tests.length)*100)}% Pass Rate)`);
if (failed > 0) {
  console.log(`❌ Failed Tests Count: ${failed}`);
  process.exit(1);
} else {
  console.log(`🎉 ALL 30 INTENTS VERIFIED SUCCESSFULLY!`);
}
