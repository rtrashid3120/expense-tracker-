const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const oldDeleteText = 'text: \`⚠️ **Multiple Matches Found**\\n\\nI found ${matchedTargets.length} expenses matching that description. Please be more specific (e.g., provide the exact amount).\`,';
const newDeleteText = 'text: \`⚠️ **Multiple Matches Found**\\n\\nI found ${matchedTargets.length} expenses matching that description. Please reply with more details to help me find it, such as:\\n• The exact amount (e.g., "1000")\\n• The date (e.g., "yesterday", "today", "on sep 20")\`,\n';

const oldAmountModifyText = 'text: \`⚠️ **Multiple Matches Found**\\n\\nI found ${matchedTargets.length} expenses matching that description. Please be more specific (e.g., provide the exact date like "yesterday").\`,';
const newAmountModifyText = 'text: \`⚠️ **Multiple Matches Found**\\n\\nI found ${matchedTargets.length} expenses matching that description. Please reply with more details to help me find it, such as:\\n• The exact old amount (e.g., "500")\\n• The date (e.g., "yesterday", "today", "on sep 20")\`,\n';

code = code.replace(oldDeleteText, newDeleteText);
code = code.replace(oldAmountModifyText, newAmountModifyText);

fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
