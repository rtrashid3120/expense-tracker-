const fs = require('fs');
let content = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

// FIX 1: "put all swiggy into dining" - 'into' is not recognized as 'to'
// Solution: normalize 'into' -> 'to' before matching, and add it to regex
content = content.replace(
  /const bulkCatMatch = query\.match\(/g,
  `const normalizedQuery = query.replace(/\\binto\\b/gi, 'to').replace(/\\binside\\b/gi, 'to').replace(/\\bunder\\b/gi, 'to').replace(/\\bwithin\\b/gi, 'to');\n    const bulkCatMatch = normalizedQuery.match(`
);

// FIX 2: "delete saloon on 20 sep" - day before month fails when 'on' precedes it
// The dateRegex in single delete only captures Month Day when 'on' is prefix.
// Need to add the Day-then-Month variant when preceded by "on"
content = content.replace(
  /const dateRegex = \/\\b\(\?:on\|from\|for\)\?\\s\*\(\?:\(\\d\{1,2\}\)\(\?:st\|nd\|rd\|th\)\?\\s\+\(\[a-z\]\+\)\|\(\[a-z\]\+\)\\s\+\(\\d\{1,2\}\)\(\?:st\|nd\|rd\|th\)\?\)\\b\/i;/,
  `const dateRegex = /\\b(?:on|from|for)?\\s*(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+([a-z]+)|([a-z]+)\\s+(\\d{1,2})(?:st|nd|rd|th)?)\\b/i;`
);

// Also fix: single-delete date matching when input is "20 sep" after extracting "on"
// The regex currently works for "on sep 20" but not "on 20 sep" because 'on' absorbs the space
// Fix by also trying without the leading 'on'
content = content.replace(
  /const dateRegex = \/\\b\(\?:on\|from\|for\)\?\\s\*\(\?:\(\\d\{1,2\}\)\(\?:st\|nd\|rd\|th\)\?\\s\+\(\[a-z\]\+\)\|\(\[a-z\]\+\)\\s\+\(\\d\{1,2\}\)\(\?:st\|nd\|rd\|th\)\?\)\\b\/i;\n      const dMatch = cleanQuery\.match\(dateRegex\);/g,
  `const dateRegex = /\\b(?:on\\s+|from\\s+|for\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+([a-z]+)\\b|\\b(?:on\\s+|from\\s+|for\\s+)?([a-z]+)\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b/i;
      const dMatch = cleanQuery.match(dateRegex);`
);

content = content.replace(
  /let dayStr = dMatch\[1\], monthStr = dMatch\[2\];\n        if \(!dayStr\) \{ dayStr = dMatch\[4\]; monthStr = dMatch\[3\]; \}/g,
  `let dayStr = dMatch[1] || dMatch[4], monthStr = dMatch[2] || dMatch[3];`
);

fs.writeFileSync('src/components/AIChatDrawer.tsx', content, 'utf8');
