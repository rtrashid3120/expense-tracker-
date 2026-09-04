const query = "transfer evrything from sep 20 to sep 21";

const parseFlexibleDate = (dStr) => {
  const cleanStr = dStr.replace(/st|nd|rd|th/g, '').trim();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const m1 = cleanStr.match(/(\d{1,2})\s+([a-z]+)/i); // Day then Month
  const m2 = cleanStr.match(/([a-z]+)\s+(\d{1,2})/i); // Month then Day
  
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

const bulkDateMatch = query.match(/\b(?:change|move|shift|transfer|update|switch|alter|modify|migrate|swap|convert)\b.*?\b(?:from|on|of)\b\s+([^]+?)\s+\bto\b\s+([^]+)/i);
if (bulkDateMatch) {
  const fromDate = parseFlexibleDate(bulkDateMatch[1]);
  const toDate = parseFlexibleDate(bulkDateMatch[2]);
  console.log("Date Shift: ", { fromDate, toDate });
}

