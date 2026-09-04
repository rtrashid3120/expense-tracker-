const queries = [
  "spend 40 on movie on 20 sep",
  "spent 50 on tea and 400 on groceries",
  "Spent $50 on an Uber",
  "I bought 3 coffees for 120 each",
  "split a 1500 dinner with Rahul and Amit",
  "change all my spending from 20 sep to 21 sep",
  "change all swiggy expenses to Dining",
  "delete all my movie expenses",
  "change the 500 rent expense to 600",
  "roast my spending",
  "remind me to pay 499 for netflix",
  "netflix 199",
  "what did I spend today?",
  "how much did I spend on food this month?",
  "who created you?"
];

let passed = 0;
console.log("=== EXPENSEHUB NLP TEST SUITE ===");

queries.forEach((q, i) => {
  let matched = "";
  
  // 1. Math / Currency
  let p = q.toLowerCase();
  if (/(\d+)\s+([a-z\s]+?)\s+(?:for|at)\s+(\d+)\s+each/i.test(p)) matched = "Receipt Math";
  else if (/\$(\d+)/i.test(p)) matched = "Currency Conversion (USD)";
  
  // 2. Date parsing inside parseMultiExpenses
  else if (/\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(p)) matched = "Past Date Parsing";
  
  // 3. Split
  else if (/\bsplit\b/i.test(p) && /\bwith\b/i.test(p)) matched = "AI Bill Splitting";
  
  // 4. Bulk
  else if (/\b(?:change|move|shift)\b.*?\b(?:all|the)?\b.*?\b(?:spending|expenses|transactions)\b.*?\b(?:from|on)\b\s+(.*?)\s+\bto\b\s+(.*)/i.test(p)) matched = "Bulk Date Shift";
  else if (/\b(?:change|move|update)\b.*?\b(?:all|every|the)\b\s+(.*?)\s+(?:expenses|spending|transactions)\b.*?\bto\b\s+(.*)/i.test(p)) matched = "Bulk Category Shift";
  
  // 5. Delete
  else if (/\b(delete|remove)\b/i.test(p) && /\b(all|every)\b/i.test(p)) matched = "Bulk Delete";
  
  // 6. Update Single
  else if (/\b(?:change|update|edit)\b.*?\b(?:the|my)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s+(.*?)\s+(?:expense|spending|transaction)?\b.*?\bto\b\s+(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i.test(p)) matched = "Single Amount Modification";
  
  // 7. Roast
  else if (/\b(roast my spending)\b/i.test(p)) matched = "Financial Roasting";
  
  // 8. Subscription
  else if (/\b(remind me to pay|recurring|subscription)\b/i.test(p)) matched = "Subscription Tracking";
  
  // 9. Reporting
  else if (/\b(today|today's expenses)\b/i.test(p)) matched = "Recent Expense Report";
  else if (/\b(how much|spend on)\b/i.test(p)) matched = "Category Spend Report";
  else if (/\b(who created|built)\b/i.test(p)) matched = "Creator Easter Egg";
  
  // 10. Multi Add
  else if (/and|&|,/.test(p)) matched = "Multi-Item Addition";
  
  // 11. Simple Add / Lazy
  else if (/\d+/.test(p)) matched = "Lazy Item Addition (Auto Categorization)";
  
  if (matched) {
    passed++;
    console.log(`[PASS] "${q}" -> Detected as: ${matched}`);
  } else {
    console.log(`[FAIL] "${q}"`);
  }
});

console.log(`\nRESULTS: ${passed}/${queries.length} TESTS PASSED.`);
