const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

// 1. Single Expense Amount Modification
code = code.replace(
  "const cleanNote = isAmountModifyIntent[2].trim().toLowerCase();",
  "const cleanNote = isAmountModifyIntent[2].replace(/[^\\w\\s-]/gi, '').trim().toLowerCase();"
);

// 2. Bulk Deletion
code = code.replace(
  "let cleanNote = query.replace(/\\b(delete|remove|cancel|undo|erase|drop|clear|trash|wipe|destroy|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm|all|every|evry|everything|evrything|the|those|my|these|entire|whole|spent|add|log|bought|paid|on|for|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt|last|latest)\\b/gi, '').trim();",
  "let cleanNote = query.replace(/\\b(delete|remove|cancel|undo|erase|drop|clear|trash|wipe|destroy|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm|all|every|evry|everything|evrything|the|those|my|these|entire|whole|spent|add|log|bought|paid|on|for|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt|last|latest)\\b/gi, '').replace(/[^\\w\\s-]/gi, '').trim();"
);

// 3. Single Deletion
code = code.replace(
  "const cleanNote = cleanQuery.replace(/\\b(delete|remove|cancel|undo|erase|drop|clear|trash|wipe|destroy|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm|spent|add|log|bought|paid|on|for|from|in|at|the|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt|last|latest)\\b/gi, '').trim().replace(/\\s+/g, ' ');",
  "const cleanNote = cleanQuery.replace(/\\b(delete|remove|cancel|undo|erase|drop|clear|trash|wipe|destroy|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm|spent|add|log|bought|paid|on|for|from|in|at|the|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt|last|latest)\\b/gi, '').replace(/[^\\w\\s-]/gi, '').trim().replace(/\\s+/g, ' ');"
);

fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
