// ===========================================================
// RIGOROUS NLP TEST SUITE FOR EXPENSEHUB AI BOT
// ===========================================================

let passed = 0;
let failed = 0;
const failures = [];

// ---- MOCK DATA ----
const mockExpenses = [
  { id: 'e1', note: 'Saloon', amount: 350, category: 'Personal', date: '2026-09-20' },
  { id: 'e2', note: 'Rent', amount: 500, category: 'Housing', date: '2026-09-20' },
  { id: 'e3', note: 'Swiggy', amount: 200, category: 'Dining', date: '2026-09-20' },
  { id: 'e4', note: 'Apple music', amount: 99, category: 'Other', date: '2026-09-15' },
  { id: 'e5', note: 'Petrol', amount: 600, category: 'Transport', date: '2026-09-21' },
  { id: 'e6', note: 'Swiggy', amount: 180, category: 'Dining', date: '2026-09-22' },
  { id: 'e7', note: 'In baloon', amount: 20, category: 'Other', date: '2026-09-20' },
  { id: 'e8', note: 'Groceries', amount: 1200, category: 'Food', date: '2026-09-18' },
];

// ---- PARSERS (mirrored from AIChatDrawer.tsx) ----

const VERBS_MODIFY = "change|move|shift|transfer|update|switch|alter|modify|migrate|swap|convert|reassign|relocate|push|revert|transition|transform|reallocate|edit|fix|adjust|correct|set|make";
const VERBS_DELETE = "delete|remove|cancel|undo|erase|drop|clear|trash|wipe|destroy|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm";
const NOUNS_EXPENSE = "spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt";
const NOUNS_WILDCARD = "all|every|evry|everything|evrything|the|those|my|these|entire|whole";

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const parseFlexibleDate = (dStr) => {
  const cleanStr = dStr.replace(/st|nd|rd|th/g, '').trim();
  const m1 = cleanStr.match(/(\d{1,2})\s+([a-z]+)/i);
  const m2 = cleanStr.match(/([a-z]+)\s+(\d{1,2})/i);
  const m = m1 || m2;
  if (m) {
    let dayStr = m[1], monthStr = m[2];
    if (m === m2) { dayStr = m[2]; monthStr = m[1]; }
    const day = parseInt(dayStr);
    const monthIdx = months.findIndex(x => monthStr.toLowerCase().startsWith(x));
    if (monthIdx !== -1 && day >= 1 && day <= 31) {
      const d = new Date(2026, monthIdx, day);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  }
  return null;
};

const parseFlexibleDateWithRaw = (query) => {
  const dateRegex = /\b(?:on|from|for)?\s*(?:(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)|([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?)\b/i;
  const m = query.match(dateRegex);
  if (m) {
    let dayStr = m[1], monthStr = m[2];
    if (!dayStr) { dayStr = m[4]; monthStr = m[3]; }
    const day = parseInt(dayStr);
    const monthIdx = months.findIndex(x => monthStr.toLowerCase().startsWith(x));
    if (monthIdx !== -1 && day >= 1 && day <= 31) {
      const d = new Date(2026, monthIdx, day);
      return { dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, rawMatch: m[0] };
    }
  }
  return null;
};

const simulateBotResponse = (query) => {
  const q = query.trim();

  // ---- BULK DATE SHIFT ----
  const bulkDateMatch = q.match(new RegExp(`\\b(?:${VERBS_MODIFY})\\b.*?\\b(?:from|on|of|for)\\b\\s+([^]+?)\\s+\\bto\\b\\s+([^]+)`, 'i'));
  if (bulkDateMatch) {
    const fromDate = parseFlexibleDate(bulkDateMatch[1]);
    const toDate = parseFlexibleDate(bulkDateMatch[2]);
    if (fromDate && toDate) {
      const targets = mockExpenses.filter(e => e.date && e.date.startsWith(fromDate));
      return { intent: 'BULK_DATE_SHIFT', fromDate, toDate, targets: targets.map(t=>t.id) };
    }
  }

  // ---- BULK CATEGORY SHIFT ----
  const bulkCatMatch = q.match(new RegExp(`\\b(?:${VERBS_MODIFY}|assign|put)\\b.*?\\b(?:${NOUNS_WILDCARD})?\\b\\s*(.*?)(?:\\s+(?:${NOUNS_EXPENSE}))?\\s+\\bto\\b\\s+(.*)`, 'i'));
  if (bulkCatMatch && bulkCatMatch[1].trim()) {
    const itemSearch = bulkCatMatch[1].toLowerCase().trim().replace(new RegExp(`\\b(?:${NOUNS_EXPENSE}|${NOUNS_WILDCARD})\\b`, 'gi'), '').trim();
    const targetCategory = bulkCatMatch[2].toLowerCase().trim().replace(/category/i, '').trim();
    if (itemSearch && !itemSearch.match(/^\d+$/) && targetCategory) {
      const targets = mockExpenses.filter(e => (e.note || '').toLowerCase().includes(itemSearch) || (e.category || '').toLowerCase() === itemSearch);
      if (targets.length > 0) {
        return { intent: 'BULK_CATEGORY_SHIFT', itemSearch, targetCategory, targets: targets.map(t=>t.id) };
      }
    }
  }

  // ---- AMOUNT MODIFICATION ----
  const amtMatch = q.match(new RegExp(`\\b(?:${VERBS_MODIFY})\\b.*?\\b(?:the|my|this|that|those|these)?\\s*(?:rs\\.?|₹|inr|rupees|bucks)?\\s*(\\d+(?:\\.\\d+)?)\\s+(.*?)(?:\\s+(?:${NOUNS_EXPENSE}))?\\s+\\bto\\b\\s+(?:rs\\.?|₹|inr|rupees|bucks)?\\s*(\\d+(?:\\.\\d+)?)`, 'i'));
  if (amtMatch) {
    const oldAmt = Number(amtMatch[1]), note = amtMatch[2].trim().toLowerCase(), newAmt = Number(amtMatch[3]);
    const target = mockExpenses.find(e => e.amount === oldAmt && ((e.note||'').toLowerCase().includes(note) || (e.category||'').toLowerCase().includes(note)));
    if (target) return { intent: 'AMOUNT_MODIFICATION', oldAmt, note, newAmt, targetId: target.id };
  }

  // ---- DELETE ----
  const isDeleteIntent = new RegExp(`\\b(${VERBS_DELETE})\\b`, 'i').test(q);
  if (isDeleteIntent) {
    if (new RegExp(`\\b(${NOUNS_WILDCARD})\\b`, 'i').test(q)) {
      let cleanNote = q.replace(new RegExp(`\\b(${VERBS_DELETE}|${NOUNS_WILDCARD}|spent|add|log|bought|paid|on|for|rupees|rs|₹|inr|bucks|${NOUNS_EXPENSE}|last|latest)\\b`, 'gi'), '').trim();
      const targets = mockExpenses.filter(e => (e.note||'').toLowerCase().includes(cleanNote.toLowerCase()) || (e.category||'').toLowerCase().includes(cleanNote.toLowerCase()));
      if (targets.length > 0 && cleanNote.length >= 2) {
        return { intent: 'BULK_DELETE', cleanNote, targets: targets.map(t=>t.id) };
      }
    }
    let cleanQuery = q;
    const dateParsed = parseFlexibleDateWithRaw(q);
    let targetDate = null;
    if (dateParsed) { targetDate = dateParsed.dateStr; cleanQuery = cleanQuery.replace(dateParsed.rawMatch, ' '); }
    const numMatchDel = cleanQuery.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i);
    const amount = numMatchDel ? Number(numMatchDel[1]) : null;
    if (numMatchDel) cleanQuery = cleanQuery.replace(numMatchDel[0], ' ');
    const cleanNote = cleanQuery.replace(new RegExp(`\\b(${VERBS_DELETE}|spent|add|log|bought|paid|on|for|rupees|rs|₹|inr|bucks|${NOUNS_EXPENSE}|last|latest)\\b`, 'gi'), '').trim().replace(/\s+/g, ' ');
    const matchedTargets = mockExpenses.filter(e => {
      const matchDate = targetDate ? (e.date && e.date.startsWith(targetDate)) : true;
      const matchAmount = amount ? e.amount === amount : true;
      const matchNote = cleanNote ? ((e.note||'').toLowerCase().includes(cleanNote.toLowerCase()) || (e.category||'').toLowerCase().includes(cleanNote.toLowerCase())) : true;
      return matchDate && matchAmount && matchNote;
    });
    if (matchedTargets.length === 1) return { intent: 'SINGLE_DELETE', cleanNote, amount, targetDate, targetId: matchedTargets[0].id };
    if (matchedTargets.length > 1) return { intent: 'AMBIGUOUS_DELETE', count: matchedTargets.length };
    return { intent: 'DELETE_NOT_FOUND' };
  }

  return { intent: 'UNKNOWN' };
};

// ---- TEST RUNNER ----
const test = (name, query, expectedIntent, extraCheck) => {
  const result = simulateBotResponse(query);
  let pass = result.intent === expectedIntent;
  if (pass && extraCheck) pass = extraCheck(result);
  if (pass) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    failures.push({ name, query, expected: expectedIntent, got: result.intent, result: JSON.stringify(result) });
    console.log(`  ❌ FAIL: ${name}`);
    console.log(`      Query: "${query}"`);
    console.log(`      Expected: ${expectedIntent}, Got: ${result.intent}`);
  }
};

// ===================================================================
console.log("\n🧠 NLP TEST SUITE — EXPENSEHUB AI BOT");
console.log("=".repeat(60));

// SECTION 1: BULK DATE SHIFT
console.log("\n📅 SECTION 1: BULK DATE SHIFT (25 tests)");
test("Classic move", "change all spending from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20' && r.toDate === '2026-09-21');
test("Transfer keyword", "transfer evrything from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20' && r.toDate === '2026-09-21');
test("Switch keyword", "switch all expenses from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Migrate keyword", "migrate my records from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Relocate keyword", "relocate all from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Reassign keyword", "reassign all entries from 20 sep to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Adjust keyword", "adjust my bills from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Swap keyword", "swap the logs from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Alter keyword", "alter my history from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Revert keyword", "revert everything from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Month Day format (sep 20)", "move all from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20' && r.toDate === '2026-09-21');
test("Day Month format (20 sep)", "move all from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20' && r.toDate === '2026-09-21');
test("Ordinal format (20th sep)", "shift all from 20th sep to 21st sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20' && r.toDate === '2026-09-21');
test("Full month name", "move all from 20 september to 21 september", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20' && r.toDate === '2026-09-21');
test("Abbrev month name sep 20", "transfer records for sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Typo: evrything", "move evrything from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Typo: seperember", "transfer all from 20 septem to 21 sept", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("With 'the' keyword", "change the records from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("With 'my' keyword", "shift my entire history from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Lazy: just dates", "update from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Convert keyword", "convert all txns from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Correct keyword", "correct the entries from sep 20 to sep 21", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Targets correct expenses", "move all from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.targets.includes('e1') && r.targets.includes('e2') && r.targets.includes('e3'));
test("Make keyword", "make the expenses from 20 sep to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');
test("Fix keyword", "fix all records from sep 20 to 21 sep", "BULK_DATE_SHIFT", r => r.fromDate === '2026-09-20');

// SECTION 2: BULK CATEGORY SHIFT
console.log("\n🗂️ SECTION 2: BULK CATEGORY SHIFT (20 tests)");
test("Basic: change all swiggy to dining", "change all swiggy to dining", "BULK_CATEGORY_SHIFT");
test("Switch keyword", "switch evrything swiggy to dining", "BULK_CATEGORY_SHIFT");
test("Move keyword", "move all swiggy to dining", "BULK_CATEGORY_SHIFT");
test("Reassign keyword", "reassign all swiggy to dining", "BULK_CATEGORY_SHIFT");
test("Transfer keyword", "transfer all apple music to entertainment", "BULK_CATEGORY_SHIFT");
test("Update keyword", "update all swiggy items to dining", "BULK_CATEGORY_SHIFT");
test("Put keyword", "put all swiggy into dining", "BULK_CATEGORY_SHIFT");
test("Assign keyword", "assign all swiggy to dining", "BULK_CATEGORY_SHIFT");
test("With 'entries' noun", "move swiggy entries to dining", "BULK_CATEGORY_SHIFT");
test("With 'logs' noun", "shift swiggy logs to dining", "BULK_CATEGORY_SHIFT");
test("With 'bills' noun", "change swiggy bills to dining", "BULK_CATEGORY_SHIFT");
test("With 'records' noun", "update swiggy records to food", "BULK_CATEGORY_SHIFT");
test("Typo: evrything", "switch evrything swiggy to food", "BULK_CATEGORY_SHIFT");
test("'these' keyword", "move these swiggy txns to dining", "BULK_CATEGORY_SHIFT");
test("'entire' keyword", "update my entire swiggy to food", "BULK_CATEGORY_SHIFT");
test("'whole' keyword", "transfer the whole swiggy to food", "BULK_CATEGORY_SHIFT");
test("Correct targets Swiggy", "change all swiggy to dining", "BULK_CATEGORY_SHIFT", r => r.targets.includes('e3') && r.targets.includes('e6'));
test("Correct target Apple", "transfer all apple music to entertainment", "BULK_CATEGORY_SHIFT", r => r.targets.includes('e4'));
test("Migrate keyword", "migrate swiggy items to dining", "BULK_CATEGORY_SHIFT");
test("Adjust keyword", "adjust all swiggy to food", "BULK_CATEGORY_SHIFT");

// SECTION 3: SINGLE DELETE
console.log("\n🗑️ SECTION 3: SINGLE DELETE (25 tests)");
test("Basic by note", "delete saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Cancel keyword", "cancel saloon on sep 20", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Remove keyword", "remove saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Erase keyword", "erase saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Drop keyword", "drop saloon expense", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Clear keyword", "clear saloon record", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Trash keyword", "trash saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Wipe keyword", "wipe saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Scrap keyword", "scrap saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Discard keyword", "discard saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("By amount and note", "delete 350 saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("By note and date (sep 20)", "cancel saloon on sep 20", "SINGLE_DELETE", r => r.targetId === 'e1');
test("By note and date (20 sep)", "delete saloon on 20 sep", "SINGLE_DELETE", r => r.targetId === 'e1');
test("By note with rs prefix", "delete rs 350 saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("By note with ₹ prefix", "delete ₹350 saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Undo keyword", "undo saloon entry", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Void keyword", "void saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Kill keyword", "kill saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Nuke keyword", "nuke saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Chuck keyword", "chuck saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Bin keyword", "bin saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Del keyword", "del saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Rm keyword", "rm saloon", "SINGLE_DELETE", r => r.targetId === 'e1');
test("Note in sep 20 no amount", "cancel saloon sep 20", "SINGLE_DELETE", r => r.targetId === 'e1');
test("'In baloon' is NOT deleted when asking for saloon", "cancel saloon on sep 20", "SINGLE_DELETE", r => r.targetId !== 'e7');

// SECTION 4: BULK DELETE
console.log("\n🗑️🗑️ SECTION 4: BULK DELETE (10 tests)");
test("Delete all swiggy", "delete all swiggy", "BULK_DELETE", r => r.targets.includes('e3') && r.targets.includes('e6'));
test("Remove everything swiggy", "remove everything swiggy", "BULK_DELETE");
test("Wipe all swiggy", "wipe all swiggy expenses", "BULK_DELETE");
test("Trash all swiggy", "trash all swiggy", "BULK_DELETE");
test("Nuke all swiggy", "nuke all swiggy records", "BULK_DELETE");
test("Erase entire swiggy", "erase entire swiggy", "BULK_DELETE");
test("Clear all swiggy bills", "clear all swiggy bills", "BULK_DELETE");
test("Delete whole swiggy", "delete whole swiggy", "BULK_DELETE");
test("Discard all swiggy", "discard all swiggy", "BULK_DELETE");
test("Chuck all swiggy", "chuck all swiggy", "BULK_DELETE");

// SECTION 5: DATE PARSING
console.log("\n📅 SECTION 5: DATE PARSING (15 tests)");
const dateParse = (s) => parseFlexibleDate(s);
const dateTest = (name, input, expected) => {
  const result = dateParse(input);
  if (result === expected) { passed++; console.log(`  ✅ PASS: ${name}`); }
  else { failed++; failures.push({ name, query: input, expected, got: result }); console.log(`  ❌ FAIL: ${name} — Expected ${expected} got ${result}`); }
};
dateTest("20 sep", "20 sep", "2026-09-20");
dateTest("sep 20", "sep 20", "2026-09-20");
dateTest("20th sep", "20th sep", "2026-09-20");
dateTest("20th september", "20th september", "2026-09-20");
dateTest("september 20", "september 20", "2026-09-20");
dateTest("21 sep", "21 sep", "2026-09-21");
dateTest("sep 21", "sep 21", "2026-09-21");
dateTest("1 jan", "1 jan", "2026-01-01");
dateTest("31 dec", "31 dec", "2026-12-31");
dateTest("15 oct", "15 oct", "2026-10-15");
dateTest("oct 15", "oct 15", "2026-10-15");
dateTest("1st jan", "1st jan", "2026-01-01");
dateTest("21st sep", "21st sep", "2026-09-21");
dateTest("2nd feb", "2nd feb", "2026-02-02");
dateTest("3rd mar", "3rd mar", "2026-03-03");

// SECTION 6: AMOUNT MODIFICATION
console.log("\n💰 SECTION 6: AMOUNT MODIFICATION (10 tests)");
test("Classic: change 500 rent to 600", "change 500 rent to 600", "AMOUNT_MODIFICATION", r => r.oldAmt === 500 && r.newAmt === 600 && r.targetId === 'e2');
test("Update keyword", "update 500 rent to 600", "AMOUNT_MODIFICATION", r => r.oldAmt === 500 && r.newAmt === 600);
test("Fix keyword", "fix 500 rent to 600", "AMOUNT_MODIFICATION");
test("Adjust keyword", "adjust 500 rent to 600", "AMOUNT_MODIFICATION");
test("Modify keyword", "modify the 500 rent to 600", "AMOUNT_MODIFICATION");
test("Alter keyword", "alter 500 rent to 600", "AMOUNT_MODIFICATION");
test("Edit keyword", "edit 500 rent to 600", "AMOUNT_MODIFICATION");
test("Correct keyword", "correct 500 rent to 600", "AMOUNT_MODIFICATION");
test("With 'the' prefix", "change the 500 rent to 600", "AMOUNT_MODIFICATION");
test("With 'my' prefix", "change my 500 rent to 600", "AMOUNT_MODIFICATION");

// ===================================================================
// FINAL REPORT
console.log("\n" + "=".repeat(60));
console.log(`🏁 FINAL TEST RESULTS`);
console.log("=".repeat(60));
console.log(`  ✅ PASSED: ${passed}`);
console.log(`  ❌ FAILED: ${failed}`);
console.log(`  📊 TOTAL:  ${passed + failed}`);
const rate = ((passed / (passed + failed)) * 100).toFixed(1);
console.log(`  🎯 PASS RATE: ${rate}%`);

if (failures.length > 0) {
  console.log(`\n❌ FAILED TESTS (${failures.length}):`);
  failures.forEach((f, i) => {
    console.log(`  ${i+1}. [${f.name}]`);
    console.log(`     Query: "${f.query}"`);
    console.log(`     Expected: ${f.expected}, Got: ${f.got || f.result}`);
  });
}
