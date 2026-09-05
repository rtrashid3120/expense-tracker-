const query = "transfer evrything , all the spenfdings .. form yesterday to today";
const cleanQuery = query.toLowerCase().replace(/form\b/gi, 'from'); // typo fix

const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
const dayMonthRegex = new RegExp(`(?:on\\s+|from\\s+|for\\s+|in\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}(?:\\s+(\\d{4}))?\\b`, 'gi');
const monthDayRegex = new RegExp(`(?:on\\s+|from\\s+|for\\s+|in\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`, 'gi');
const relativeRegex = /\b(?:from\s+|to\s+|on\s+)?(yesterday|today|tomorrow)\b/gi;

const dm = [...cleanQuery.matchAll(dayMonthRegex)];
const md = [...cleanQuery.matchAll(monthDayRegex)];
const rel = [...cleanQuery.matchAll(relativeRegex)];

const allDates = [];

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
    allDates.push({ matchStr: match[0], index: match.index, day: parseInt(match[1]), month: monthIdx, year: match[3] ? parseInt(match[3]) : new Date().getFullYear() });
  }
}
for (const match of md) {
  const monthIdx = parseMonth(match[1]);
  if (monthIdx !== -1) {
    allDates.push({ matchStr: match[0], index: match.index, day: parseInt(match[2]), month: monthIdx, year: match[3] ? parseInt(match[3]) : new Date().getFullYear() });
  }
}
for (const match of rel) {
  const word = match[1].toLowerCase();
  const d = new Date();
  if (word === 'yesterday') d.setDate(d.getDate() - 1);
  if (word === 'tomorrow') d.setDate(d.getDate() + 1);
  allDates.push({ matchStr: match[0], index: match.index, day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
}

allDates.sort((a, b) => a.index - b.index);

console.log(allDates);
