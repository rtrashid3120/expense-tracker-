// Re-run 2 specific failed tests after fix verification

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

// Test Fix 1: "into" -> "to" normalization
const q1 = "put all swiggy into dining";
const normalized1 = q1.replace(/\binto\b/gi, 'to').replace(/\binside\b/gi, 'to');
const VERBS_MODIFY = "change|move|shift|transfer|update|switch|alter|modify|migrate|swap|convert|reassign|relocate|push|revert|transition|transform|reallocate|edit|fix|adjust|correct|set|make";
const NOUNS_WILDCARD = "all|every|evry|everything|evrything|the|those|my|these|entire|whole";
const NOUNS_EXPENSE = "spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt";
const bulkCatMatch1 = normalized1.match(new RegExp(`\\b(?:${VERBS_MODIFY}|assign|put)\\b.*?\\b(?:${NOUNS_WILDCARD})?\\b\\s*(.*?)(?:\\s+(?:${NOUNS_EXPENSE}))?\\s+\\bto\\b\\s+(.*)`, 'i'));
const itemSearch1 = bulkCatMatch1?.[1]?.toLowerCase().trim().replace(new RegExp(`\\b(?:${NOUNS_EXPENSE}|${NOUNS_WILDCARD})\\b`, 'gi'), '').trim();
console.log("Fix 1 - 'put all swiggy into dining':");
console.log("  Normalized:", normalized1);
console.log("  Match:", !!bulkCatMatch1);
console.log("  itemSearch:", itemSearch1);
console.log("  Result:", itemSearch1 === 'swiggy' ? '✅ PASS' : '❌ FAIL');

// Test Fix 2: "delete saloon on 20 sep"
const q2 = "delete saloon on 20 sep";
const dateRegex2 = /\b(?:on\s+|from\s+|for\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\b|\b(?:on\s+|from\s+|for\s+)?([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;
const dMatch2 = q2.match(dateRegex2);
let dayStr2 = dMatch2?.[1] || dMatch2?.[4], monthStr2 = dMatch2?.[2] || dMatch2?.[3];
const day2 = parseInt(dayStr2);
const monthIdx2 = months.findIndex(x => monthStr2?.toLowerCase().startsWith(x));
const dateResult = (monthIdx2 !== -1 && day2 >= 1 && day2 <= 31) ? `2026-${String(monthIdx2+1).padStart(2,'0')}-${String(day2).padStart(2,'0')}` : null;
console.log("\nFix 2 - 'delete saloon on 20 sep':");
console.log("  Match:", dMatch2?.[0]);
console.log("  day:", day2, "month:", monthStr2, "monthIdx:", monthIdx2);
console.log("  Date parsed:", dateResult);
console.log("  Result:", dateResult === '2026-09-20' ? '✅ PASS' : '❌ FAIL');
