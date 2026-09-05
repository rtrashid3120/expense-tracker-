const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

code = code.replace("const historyForApi = messages\n        .filter(m => m.id !== 'welcome')\n        .map(m => ({ sender: m.sender, text: m.text }));", "");

code = code.replace("const { monthlyBudget, balance } = getBudgetAnalysis(validExpenses, profile);", "const { monthlyBudget } = getBudgetAnalysis(validExpenses, profile);");

fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
