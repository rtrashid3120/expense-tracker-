const fs = require('fs');
let content = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const VERBS_MODIFY = "change|move|shift|transfer|update|switch|alter|modify|migrate|swap|convert|reassign|relocate|push|revert|transition|transform|reallocate|edit|fix|adjust|correct|set|make";
const NOUNS_EXPENSE = "spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt";
const NOUNS_WILDCARD = "all|every|evry|everything|evrything|the|those|my|these|entire|whole";

content = content.replace(
  /const bulkCatMatch = query\.match\(\/\\b\(\?:change\|move\|update\|transfer\|switch\|alter\|modify\|migrate\|assign\|set\)\\b\.\*\?\\b\(\?:all\|every\|evry\|everything\|evrything\|the\|those\|my\)\?\\b\\s\*\(\.\*\?\)\(\?:\\s\+\(\?:expenses\|spending\|spendings\|transactions\|items\|bills\|records\|data\)\)\?\\s\+\\bto\\b\\s\+\(\.\*\)\/i\);/,
  `const bulkCatMatch = query.match(/\\b(?:${VERBS_MODIFY}|assign|put)\\b.*?\\b(?:${NOUNS_WILDCARD})?\\b\\s*(.*?)(?:\\s+(?:${NOUNS_EXPENSE}))?\\s+\\bto\\b\\s+(.*)/i);`
);

fs.writeFileSync('src/components/AIChatDrawer.tsx', content, 'utf8');
