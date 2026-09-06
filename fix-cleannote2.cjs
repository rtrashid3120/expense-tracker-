const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const targetRegexLine = /const cleanNote = cleanQuery\.replace\(\/\\b\(delete\|deleted\|remove\|removed\|cancel\|canceled\|cancelled\|undo\|erase\|erased\|drop\|dropped\|clear\|cleared\|trash\|trashed\|wipe\|wiped\|destroy\|destroyed\|discard\|eliminate\|nuke\|kill\|void\|scrap\|chuck\|dump\|bin\|del\|rm\|spent\|add\|log\|bought\|paid\|on\|for\|from\|in\|at\|the\|rupees\|rs\|₹\|inr\|bucks\|spending\|spendings\|expense\|expenses\|transaction\|transactions\|item\|items\|bill\|bills\|record\|records\|data\|entry\|entries\|history\|log\|logs\|purchases\|payments\|exp\|txn\|txns\|amt\|last\|latest\)\\b\/gi, ''\)/;

const replacementString = "const cleanNote = cleanQuery.replace(/\\b(delete|deleted|remove|removed|cancel|canceled|cancelled|undo|erase|erased|drop|dropped|clear|cleared|trash|trashed|wipe|wiped|destroy|destroyed|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm|all|every|evry|everything|evrything|the|those|my|these|entire|whole|spent|add|log|bought|paid|on|for|from|in|at|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt|last|latest)\\b/gi, '')";

code = code.replace(targetRegexLine, replacementString);
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
