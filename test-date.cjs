const query = "spent 30 on banana , 40 on curd , on sep 20";
let cleanedQuery = query.toLowerCase();

const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";

const dayMonthRegex = new RegExp(`\\b(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}(?:\\s+(\\d{4}))?\\b`, 'gi');
const monthDayRegex = new RegExp(`\\b(?:on\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`, 'gi');

const dayMonthMatches = [...cleanedQuery.matchAll(dayMonthRegex)];
const monthDayMatches = [...cleanedQuery.matchAll(monthDayRegex)];

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const parseMonth = (mStr) => {
  let str = mStr.toLowerCase();
  if (str.startsWith('spe')) str = 'sep';
  if (str.startsWith('augu')) str = 'aug';
  if (str.startsWith('jne')) str = 'jun';
  if (str.startsWith('jlu')) str = 'jul';
  return months.findIndex(m => str.startsWith(m));
};

let matchedMonth = -1;
let day = -1;
let year = 2024;

for (const m of dayMonthMatches) {
  const mIdx = parseMonth(m[2]);
  if (mIdx !== -1) {
    matchedMonth = mIdx;
    day = parseInt(m[1]);
    if (m[3]) year = parseInt(m[3]);
    cleanedQuery = cleanedQuery.replace(m[0], '');
    break;
  }
}

if (matchedMonth === -1) {
  for (const m of monthDayMatches) {
    const mIdx = parseMonth(m[1]);
    if (mIdx !== -1) {
      matchedMonth = mIdx;
      day = parseInt(m[2]);
      if (m[3]) year = parseInt(m[3]);
      cleanedQuery = cleanedQuery.replace(m[0], '');
      break;
    }
  }
}

console.log("Matched Month:", matchedMonth);
console.log("Day:", day);
console.log("Cleaned:", cleanedQuery);
