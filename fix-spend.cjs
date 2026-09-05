const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

code = code.replace(
  "const hasAddActionKeyword = /\\b(spent|add|log|bought|paid|pay|bill|purchase|entry|record|deduct)\\b/i.test(query);",
  "const hasAddActionKeyword = /\\b(spent|spend|spending|add|log|bought|paid|pay|bill|purchase|purchased|entry|record|deduct|cost|charge)\\b/i.test(query);"
);

fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
