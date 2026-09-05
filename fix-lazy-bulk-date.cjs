const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const oldLine = "const isBulkDateTransfer = /\\b(transfer|move|shift|change)\\b.*\\b(all|every|evry|everything|evrything|spendings|expenses|records|transactions)\\b.*\\b(from|form)\\b.*\\b(to)\\b/i.test(query);";

// We'll replace it with a function that actually checks for two dates if the explicit regex fails.
const newLine = `
    let isBulkDateTransfer = /\\b(transfer|move|shift|change)\\b.*\\b(all|every|evry|everything|evrything|spendings|expenses|records|transactions)\\b.*\\b(from|form)?\\b.*\\b(to)\\b/i.test(query);
    
    if (!isBulkDateTransfer && /\\b(transfer|move|shift|change)\\b.*\\bto\\b/i.test(query)) {
      const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
      const d1 = new RegExp(\`\\\\b(?:on\\\\s+|from\\\\s+|for\\\\s+|in\\\\s+)?(\\\\d{1,2})(?:st|nd|rd|th)?\\\\s*\${mRegex}\\\\b\`, 'gi');
      const d2 = new RegExp(\`\\\\b(?:on\\\\s+|from\\\\s+|for\\\\s+|in\\\\s+)?\${mRegex}\\\\s*(\\\\d{1,2})(?:st|nd|rd|th)?\\\\b\`, 'gi');
      const d3 = /\\b(yesterday|today|tomorrow)\\b/gi;
      
      const count = [...query.matchAll(d1)].length + [...query.matchAll(d2)].length + [...query.matchAll(d3)].length;
      if (count >= 2) {
        isBulkDateTransfer = true;
      }
    }
`;

code = code.replace(oldLine, newLine.trim());
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
