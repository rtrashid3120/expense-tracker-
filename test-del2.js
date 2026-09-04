const parseFlexibleDateMatch = (query) => {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  // We want to capture the string that matched so we can remove it from query
  const dateRegex = /\b(?:on|from|for)?\s*(?:(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)|([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?)\b/i;
  const m = query.match(dateRegex);
  if (m) {
    let dayStr = m[1], monthStr = m[2];
    if (!dayStr) { dayStr = m[4]; monthStr = m[3]; }
    const day = parseInt(dayStr);
    const monthIdx = months.findIndex(x => monthStr.toLowerCase().startsWith(x));
    if (monthIdx !== -1 && day >= 1 && day <= 31) {
      const d = new Date(new Date().getFullYear(), monthIdx, day);
      return {
        dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
        rawMatch: m[0]
      };
    }
  }
  return null;
};

const query = "delete 500 rent";
let cleanQuery = query;
const dateParsed = parseFlexibleDateMatch(query);
let targetDate = null;
if (dateParsed) {
  targetDate = dateParsed.dateStr;
  cleanQuery = cleanQuery.replace(dateParsed.rawMatch, ' ');
}

// Extract Amount
const numMatch = cleanQuery.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i);
const amount = numMatch ? Number(numMatch[1]) : null;
if (numMatch) {
  cleanQuery = cleanQuery.replace(numMatch[0], ' ');
}

// Clean words
const cleanNote = cleanQuery.replace(/\b(delete|remove|cancel|undo|erase|drop|clear|trash|wipe|spent|add|log|bought|paid|on|for|rupees|rs|₹|inr|expense|expenses|spending|spendings|transactions|bills|records|data|last|latest|item)\b/gi, '').trim().replace(/\s+/g, ' ');

console.log({ targetDate, amount, cleanNote });
