const assert = require('assert');

function testAmountModification(query) {
  const isAmountModifyAction = /\b(?:change|move|shift|update|alter|modify|edit|fix|adjust|correct|set)\b/i.test(query) && /\bto\b/i.test(query);
  if (!isAmountModifyAction) return null;

  let cleanQuery = query.toLowerCase();
  let targetDate = null;
  
  // Relative dates
  if (/\b(?:today)\b/i.test(cleanQuery)) { targetDate = 'today'; cleanQuery = cleanQuery.replace(/\b(?:on\s+|from\s+|for\s+|in\s+)?(?:today)\b/gi, ' '); }
  else if (/\b(?:yesterday)\b/i.test(cleanQuery)) { targetDate = 'yesterday'; cleanQuery = cleanQuery.replace(/\b(?:on\s+|from\s+|for\s+|in\s+)?(?:yesterday)\b/gi, ' '); }
  else {
    const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
    const dayMonthRegex = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}\\b`, 'i');
    const monthDayRegex = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
    
    const dMatch = cleanQuery.match(dayMonthRegex) || cleanQuery.match(monthDayRegex);
    if (dMatch) {
      targetDate = 'explicit_date';
      cleanQuery = cleanQuery.replace(dMatch[0], ' ');
    }
  }

  const amountsMatch = cleanQuery.match(/(?:rs\.?|₹|inr|rupees)?\s*(\d+(?:\.\d+)?)\b.*?\bto\b.*?(?:rs\.?|₹|inr|rupees)?\s*(\d+(?:\.\d+)?)\b/i);
  if (amountsMatch) {
    const oldAmount = Number(amountsMatch[1]);
    const newAmount = Number(amountsMatch[2]);
    cleanQuery = cleanQuery.replace(amountsMatch[1], ' ').replace(amountsMatch[2], ' ');
    const cleanNote = cleanQuery.replace(/\b(change|move|shift|update|alter|modify|edit|fix|adjust|correct|set|to|from|on|for|in|at|the|my|this|that|those|these|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt)\b/gi, '').replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, ' ');

    return { oldAmount, newAmount, targetDate, note: cleanNote };
  }
  return null;
}

try {
  const t1 = testAmountModification("change the 500 on cofee to 600 on aug 20");
  assert.strictEqual(t1.oldAmount, 500, "Old amount failed");
  assert.strictEqual(t1.newAmount, 600, "New amount failed");
  assert.strictEqual(t1.targetDate, "explicit_date", "Date failed");
  assert.strictEqual(t1.note, "cofee", "Note failed");

  const t2 = testAmountModification("update petrol from 1200 to 1500 yesterday");
  assert.strictEqual(t2.oldAmount, 1200, "Old amount failed (t2)");
  assert.strictEqual(t2.newAmount, 1500, "New amount failed (t2)");
  assert.strictEqual(t2.targetDate, "yesterday", "Date failed (t2)");
  assert.strictEqual(t2.note, "petrol", "Note failed (t2)");

  console.log("✅ AMOUNT MODIFICATION TESTS PASSED!");
} catch (e) {
  console.error("❌ TEST FAILED:", e.message);
  process.exit(1);
}
