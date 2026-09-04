const fs = require('fs');
const path = 'src/components/AIChatDrawer.tsx';
let content = fs.readFileSync(path, 'utf8');

const VERBS_MODIFY = "change|move|shift|transfer|update|switch|alter|modify|migrate|swap|convert|reassign|relocate|push|revert|transition|transform|reallocate|edit|fix|adjust|correct|set|make";
const VERBS_DELETE = "delete|remove|cancel|undo|erase|drop|clear|trash|wipe|destroy|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm";
const NOUNS_EXPENSE = "spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt";
const NOUNS_WILDCARD = "all|every|evry|everything|evrything|the|those|my|these|entire|whole";

content = content.replace(
  /const bulkDateMatch = query\.match\(\/\\b\(\?:.*?\)\\b\.\*\?\\b\(\?:from\|on\|of\)\\b\\s\+\(\[\^\]\+\?\)\\s\+\\bto\\b\\s\+\(\[\^\]\+\)\/i\);/,
  `const bulkDateMatch = query.match(/\\b(?:${VERBS_MODIFY})\\b.*?\\b(?:from|on|of|for)\\b\\s+([^]+?)\\s+\\bto\\b\\s+([^]+)/i);`
);

content = content.replace(
  /const bulkCatMatch = query\.match\(\/\\b\(\?:.*?\)\\b\.\*\?\\b\(\?:.*?\)\?\\b\\s\*\(\.\*\?\)\(\?:\\s\+\(\?:\.\*\?\)\)\?\\s\+\\bto\\b\\s\+\(\.\*\)\/i\);/,
  `const bulkCatMatch = query.match(/\\b(?:${VERBS_MODIFY}|assign|put)\\b.*?\\b(?:${NOUNS_WILDCARD})?\\b\\s*(.*?)(?:\\s+(?:${NOUNS_EXPENSE}))?\\s+\\bto\\b\\s+(.*)/i);`
);

content = content.replace(
  /const itemSearch = bulkCatMatch\[1\]\.toLowerCase\(\)\.trim\(\)\.replace\(\/\\b\(\?:.*?\)\\b\/gi, ''\)\.trim\(\);/,
  `const itemSearch = bulkCatMatch[1].toLowerCase().trim().replace(/\\b(?:${NOUNS_EXPENSE}|${NOUNS_WILDCARD})\\b/gi, '').trim();`
);

content = content.replace(
  /const isAmountModifyIntent = query\.match\(\/\\b\(\?:.*?\)\\b\.\*\?\\b\(\?:the\|my\)\?\\s\*\(\?:rs\\\.\?\|₹\|inr\)\?\\s\*\(\\d\+\(\?:\\\.\\d\+\)\?\)\\s\+\(\.\*\?\)\(\?:\\s\+\(\?:expense\|spending\|transaction\|bill\)\)\?\\s\+\\bto\\b\\s\+\(\?:rs\\\.\?\|₹\|inr\)\?\\s\*\(\\d\+\(\?:\\\.\\d\+\)\?\)\/i\);/,
  `const isAmountModifyIntent = query.match(/\\b(?:${VERBS_MODIFY})\\b.*?\\b(?:the|my|this|that|those|these)?\\s*(?:rs\\.?|₹|inr|rupees|bucks)?\\s*(\\d+(?:\\.\\d+)?)\\s+(.*?)(?:\\s+(?:${NOUNS_EXPENSE}))?\\s+\\bto\\b\\s+(?:rs\\.?|₹|inr|rupees|bucks)?\\s*(\\d+(?:\\.\\d+)?)/i);`
);

content = content.replace(
  /const isDeleteIntent = \/\\b\([^)]*\)\\b\/i\.test\(query\);/,
  `const isDeleteIntent = /\\b(${VERBS_DELETE})\\b/i.test(query);`
);

content = content.replace(
  /if \(\/\\b\(all\|every\|evry\|everything\|evrything\|those\|these\)\\b\/i\.test\(query\)\) \{/,
  `if (/\\b(${NOUNS_WILDCARD})\\b/i.test(query)) {`
);

const OLD_CLEAN_NOTE_1 = /let cleanNote = query\.replace\(\/\\b\(delete.*?\)\\b\/gi, ''\)\.trim\(\);/;
content = content.replace(
  OLD_CLEAN_NOTE_1,
  `let cleanNote = query.replace(/\\b(${VERBS_DELETE}|${NOUNS_WILDCARD}|spent|add|log|bought|paid|on|for|rupees|rs|₹|inr|bucks|${NOUNS_EXPENSE}|last|latest)\\b/gi, '').trim();`
);

const OLD_CLEAN_NOTE_2 = /const cleanNote = cleanQuery\.replace\(\/\\b\(delete.*?\)\\b\/gi, ''\)\.trim\(\)\.replace\(\/\\s\+\/g, ' '\);/;
content = content.replace(
  OLD_CLEAN_NOTE_2,
  `const cleanNote = cleanQuery.replace(/\\b(${VERBS_DELETE}|spent|add|log|bought|paid|on|for|rupees|rs|₹|inr|bucks|${NOUNS_EXPENSE}|last|latest)\\b/gi, '').trim().replace(/\\s+/g, ' ');`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Massive NLP update applied!');
