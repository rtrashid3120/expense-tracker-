const VERBS_MODIFY = "change|move|shift|transfer|update|switch|alter|modify|migrate|swap|convert|reassign|relocate|push|revert|transition|transform|reallocate|edit|fix|adjust|correct|set|make";
const VERBS_DELETE = "delete|remove|cancel|undo|erase|drop|clear|trash|wipe|destroy|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm";
const NOUNS_EXPENSE = "spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt";
const NOUNS_WILDCARD = "all|every|evry|everything|evrything|the|those|my|these|entire|whole";

const parseFlexibleDate = (dStr) => {
  const cleanStr = dStr.replace(/st|nd|rd|th/g, '').trim();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const m1 = cleanStr.match(/(\d{1,2})\s+([a-z]+)/i); 
  const m2 = cleanStr.match(/([a-z]+)\s+(\d{1,2})/i); 
  
  const m = m1 || m2;
  if (m) {
    let dayStr = m[1], monthStr = m[2];
    if (m === m2) { dayStr = m[2]; monthStr = m[1]; }
    const day = parseInt(dayStr);
    const monthIdx = months.findIndex(x => monthStr.toLowerCase().startsWith(x));
    if (monthIdx !== -1 && day >= 1 && day <= 31) {
      const d = new Date(new Date().getFullYear(), monthIdx, day);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  }
  return null;
};

const testCases = [
  { q: "transfer evrything from sep 20 to sep 21", expectedIntent: "BULK_DATE" },
  { q: "switch evrything apple to tech", expectedIntent: "BULK_CAT" },
  { q: "change the 500 rent to 600", expectedIntent: "AMOUNT_MODIFY" },
  { q: "wipe all swiggy", expectedIntent: "BULK_DELETE" },
  { q: "cancel saloon on sep 20", expectedIntent: "SINGLE_DELETE" },
  { q: "delete 500 rent", expectedIntent: "SINGLE_DELETE" },
  { q: "adjust my 300 cab bill to 400", expectedIntent: "AMOUNT_MODIFY" },
  { q: "nuke the entire swiggy log", expectedIntent: "BULK_DELETE" },
  { q: "switch all my food txns to dining", expectedIntent: "BULK_CAT" },
  { q: "trash apple on oct 5", expectedIntent: "SINGLE_DELETE" },
  { q: "reassign entire shopping to retail", expectedIntent: "BULK_CAT" }
];

let failed = 0;

for (const t of testCases) {
  let detected = "NONE";
  
  // 1. Bulk Date Shift
  const bulkDateMatch = t.q.match(new RegExp(`\\b(?:${VERBS_MODIFY})\\b.*?\\b(?:from|on|of|for)\\b\\s+([^]+?)\\s+\\bto\\b\\s+([^]+)`, 'i'));
  if (bulkDateMatch) {
    const fromDate = parseFlexibleDate(bulkDateMatch[1]);
    const toDate = parseFlexibleDate(bulkDateMatch[2]);
    if (fromDate && toDate) detected = "BULK_DATE";
  }

  // 2. Bulk Category Shift
  if (detected === "NONE") {
    const bulkCatMatch = t.q.match(new RegExp(`\\b(?:${VERBS_MODIFY}|assign|put)\\b.*?\\b(?:${NOUNS_WILDCARD})?\\b\\s*(.*?)(?:\\s+(?:${NOUNS_EXPENSE}))?\\s+\\bto\\b\\s+(.*)`, 'i'));
    if (bulkCatMatch && bulkCatMatch[1].trim()) {
      const itemSearch = bulkCatMatch[1].toLowerCase().trim().replace(new RegExp(`\\b(?:${NOUNS_EXPENSE}|${NOUNS_WILDCARD})\\b`, 'gi'), '').trim();
      if (isNaN(Number(itemSearch)) && itemSearch.length > 0) detected = "BULK_CAT";
    }
  }

  // 3. Amount Modify
  if (detected === "NONE") {
    const isAmountModifyIntent = t.q.match(new RegExp(`\\b(?:${VERBS_MODIFY})\\b.*?\\b(?:the|my|this|that|those|these)?\\s*(?:rs\\.?|₹|inr|rupees|bucks)?\\s*(\\d+(?:\\.\\d+)?)\\s+(.*?)(?:\\s+(?:${NOUNS_EXPENSE}))?\\s+\\bto\\b\\s+(?:rs\\.?|₹|inr|rupees|bucks)?\\s*(\\d+(?:\\.\\d+)?)`, 'i'));
    if (isAmountModifyIntent) detected = "AMOUNT_MODIFY";
  }

  // 4. Delete Intents
  if (detected === "NONE") {
    const isDeleteIntent = new RegExp(`\\b(${VERBS_DELETE})\\b`, 'i').test(t.q);
    if (isDeleteIntent) {
      if (new RegExp(`\\b(${NOUNS_WILDCARD})\\b`, 'i').test(t.q)) {
        detected = "BULK_DELETE";
      } else {
        detected = "SINGLE_DELETE";
      }
    }
  }

  if (detected !== t.expectedIntent) {
    console.log(`❌ FAILED: "${t.q}" -> Expected: ${t.expectedIntent}, Got: ${detected}`);
    failed++;
  } else {
    console.log(`✅ PASSED: "${t.q}"`);
  }
}

console.log(`\nTest Summary: ${testCases.length - failed}/${testCases.length} Passed. ${failed} Failed.`);
