const query = "transfer evrything , all the spenfdings .. form sep 20 to sep 21";
const cleanQuery = query.toLowerCase().replace(/form\b/gi, 'from'); // typo fix

const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
const dayMonthRegex = new RegExp(`(?:on\\s+|from\\s+|for\\s+|in\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}(?:\\s+(\\d{4}))?\\b`, 'gi');
const monthDayRegex = new RegExp(`(?:on\\s+|from\\s+|for\\s+|in\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`, 'gi');

const dm = [...cleanQuery.matchAll(dayMonthRegex)];
const md = [...cleanQuery.matchAll(monthDayRegex)];

const allDates = [];

// Helper
const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const parseMonth = (mStr) => {
  let str = mStr.toLowerCase();
  if (str.startsWith('spe')) str = 'sep';
  if (str.startsWith('augu')) str = 'aug';
  if (str.startsWith('jne')) str = 'jun';
  if (str.startsWith('jlu')) str = 'jul';
  return months.findIndex(m => str.startsWith(m));
};

for (const match of dm) {
  const monthIdx = parseMonth(match[2]);
  if (monthIdx !== -1) {
    allDates.push({
      matchStr: match[0],
      index: match.index,
      day: parseInt(match[1]),
      month: monthIdx,
      year: match[3] ? parseInt(match[3]) : 2024
    });
  }
}
for (const match of md) {
  const monthIdx = parseMonth(match[1]);
  if (monthIdx !== -1) {
    allDates.push({
      matchStr: match[0],
      index: match.index,
      day: parseInt(match[2]),
      month: monthIdx,
      year: match[3] ? parseInt(match[3]) : 2024
    });
  }
}

// Sort by index to know which is "from" and which is "to"
allDates.sort((a, b) => a.index - b.index);

console.log(allDates);
