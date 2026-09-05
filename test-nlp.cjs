const assert = require('assert');

function testAddExpense(query) {
  const hasAddActionKeyword = /\b(spent|spend|spending|add|log|bought|paid|pay|bill|purchase|purchased|entry|record|deduct|cost|charge)\b/i.test(query);
  return hasAddActionKeyword;
}

function testSingleDeletion(query) {
  const isDeleteIntent = /\b(delete|deleted|remove|removed|cancel|canceled|cancelled|undo|erase|erased|drop|dropped|clear|cleared|trash|trashed|wipe|wiped|destroy|destroyed|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm)\b/i.test(query);
  
  if (!isDeleteIntent) return null;

  let cleanQuery = query;
  let targetDate = null;
  
  // Relative dates
  if (/\b(?:today)\b/i.test(cleanQuery)) {
    targetDate = 'today';
    cleanQuery = cleanQuery.replace(/\b(?:on\s+|from\s+|for\s+|in\s+)?(?:today)\b/gi, ' ');
  } else if (/\b(?:yesterday)\b/i.test(cleanQuery)) {
    targetDate = 'yesterday';
    cleanQuery = cleanQuery.replace(/\b(?:on\s+|from\s+|for\s+|in\s+)?(?:yesterday)\b/gi, ' ');
  } else {
    // Explicit dates
    const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
    const dayMonthRegex = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}\\b`, 'i');
    const monthDayRegex = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
    
    const dMatch = cleanQuery.match(dayMonthRegex) || cleanQuery.match(monthDayRegex);
    if (dMatch) {
      targetDate = 'explicit_date';
      cleanQuery = cleanQuery.replace(dMatch[0], ' ');
    }
  }

  const numMatch = cleanQuery.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i);
  const amount = numMatch ? Number(numMatch[1]) : null;
  if (numMatch) {
    cleanQuery = cleanQuery.replace(numMatch[0], ' ');
  }

  const cleanNote = cleanQuery.replace(/\b(delete|deleted|remove|removed|cancel|canceled|cancelled|undo|erase|erased|drop|dropped|clear|cleared|trash|trashed|wipe|wiped|destroy|destroyed|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm|spent|add|log|bought|paid|on|for|from|in|at|the|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt|last|latest)\b/gi, '').replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, ' ');

  return { intent: 'delete', targetDate, amount, note: cleanNote };
}

function testBulkDateTransfer(query) {
  const isBulkDateTransfer = /\b(transfer|move|shift|change)\b.*\b(all|every|evry|everything|evrything|spendings|expenses|records|transactions)\b.*\b(from|form)\b.*\b(to)\b/i.test(query);
  return isBulkDateTransfer;
}

try {
  // Test 1: Add Expense using "spend"
  assert.strictEqual(testAddExpense("spend 40 in haircut on sep 6"), true, "Add expense failed on 'spend'");
  assert.strictEqual(testAddExpense("cost 500 for taxi"), true, "Add expense failed on 'cost'");

  // Test 2: Punctuation stripping in Deletion
  const del1 = testSingleDeletion("delete cofee , in sep 20");
  assert.strictEqual(del1.note, "cofee", "Punctuation stripping failed for 'cofee ,'");
  assert.strictEqual(del1.targetDate, "explicit_date", "Date extraction failed for 'sep 20'");

  // Test 3: Relative Date in Deletion
  const del2 = testSingleDeletion("remove petrol from yesterday");
  assert.strictEqual(del2.note, "petrol", "Note extraction failed for 'petrol'");
  assert.strictEqual(del2.targetDate, "yesterday", "Relative date extraction failed for 'yesterday'");
  
  const del3 = testSingleDeletion("cancelled haircut on sep 6");
  assert.strictEqual(del3.note, "haircut", "Past tense 'cancelled' failed");
  assert.strictEqual(del3.targetDate, "explicit_date", "Date extraction failed");

  // Test 4: Bulk Date Transfer typos
  assert.strictEqual(testBulkDateTransfer("transfer evrything form yesterday to today"), true, "Bulk date typo 'form/evrything' failed");

  console.log("✅ ALL NLP TESTS PASSED PERFECTLY!");
} catch (err) {
  console.error("❌ NLP TEST FAILED:");
  console.error(err.message);
  process.exit(1);
}
