const parseFlexibleDateMatch = (query) => {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  // We want to capture the string that matched so we can remove it from query
  const dateRegex = /\b(?:on\s+)?(?:(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)|([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?)\b/i;
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

const query = "cancel saloon on sep 20";
const dateParsed = parseFlexibleDateMatch(query);
console.log("Parsed Date: ", dateParsed);

const query2 = "delete 500 rent";
console.log("Parsed Date 2: ", parseFlexibleDateMatch(query2));
