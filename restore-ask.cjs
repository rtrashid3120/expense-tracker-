const fs = require('fs');

const tryBlock = `
    try {
      const historyForApi = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ sender: m.sender, text: m.text }));

      const totalBalance = currentWallets.reduce((sum, w) => sum + (w.balance || 0), 0);
      const contextData = {
        budget: { monthlyBudget, balance: totalBalance },
        wallets,
        expenses,
        trips,
        user: profile
      };

      const res = await api.askAIChat(query.trim(), historyForApi, contextData);

      if (res.expenseAdded) {
        await fetchData(true);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        walletPrompt: res.walletPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.warn('Backend AI unavailable, using intelligent financial assistant fallback:', err);
      const fallbackText = generateLocalFinancialAnswer(
        query.trim(),
        currentWallets,
        validExpenses,
        trips,
        monthlyBudget,
        profile
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
`;

let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

// Find the spot to replace
const oldTryBlockMatch = code.match(/try \{\s*const fallbackText = generateLocalFinancialAnswer\([\s\S]*?\} finally \{\s*setIsLoading\(false\);\s*\}/);

if (oldTryBlockMatch) {
  code = code.replace(oldTryBlockMatch[0], tryBlock.trim());
  fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
  console.log("Success");
} else {
  console.log("Could not find try block");
}
