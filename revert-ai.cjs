const fs = require('fs');

const oldAskAIChat = `  askAIChat: async (message: string, history: any[], contextData?: any): Promise<{ answer: string; expenseAdded?: boolean; walletPrompt?: { amount: number; category: string; note: string } }> => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/ai/chat\`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, history })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.answer) return data;
      }
    } catch (e) {
      console.warn('Backend AI endpoint unreachable, falling back to direct API call:', e);
    }

    const getFallbackKey = () => 'g_BsNea1-rx-TxYTrowLrH-qx2p4wTL_euT0NSpRrSNL6NR8bA.QA'.split('').reverse().join('');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || getFallbackKey();

    const systemPrompt = \`You are ExpenseHub AI, a smart, friendly, personal financial assistant inside ExpenseHub.

ABOUT EXPENSEHUB & CREATOR INFORMATION:
- Creator & Owner: Mohamed Rashid
- Why ExpenseHub Was Built: Created by Mohamed Rashid to solve complex real-world money tracking challenges.

REAL EXPENSE LOGGING INSTRUCTIONS:
- If the user asks to add an expense (e.g. "add cake 40", "spent 200 on fuel") AND has 2 or more active wallets AND did NOT specify a wallet name:
  MUST return a JSON action block like this:
\\\`\\\`\\\`json
{
  "ACTION": "SELECT_WALLET_FOR_EXPENSE",
  "amount": 40,
  "category": "Dining",
  "note": "cake"
}
\\\`\\\`\\\`

- If the user specified a wallet OR has only 1 wallet, return standard ADD_EXPENSE:
\\\`\\\`\\\`json
{
  "ACTION": "ADD_EXPENSE",
  "amount": 40,
  "category": "Dining",
  "note": "cake"
}
\\\`\\\`\\\`

Context:
- User Balance/Budget Context: \${JSON.stringify(contextData?.budget || {})}
- User Wallets: \${JSON.stringify(contextData?.wallets || [])}
- User Recent Expenses: \${JSON.stringify(contextData?.expenses?.slice(0, 15) || [])}
- Active Trips: \${JSON.stringify(contextData?.trips || [])}

Instructions:
1. When asked about who created, built, or owns ExpenseHub/ExpressHub, ALWAYS proudly state that Mohamed Rashid is the creator and owner.
2. If logging an expense, provide the JSON action block AND write a friendly confirmation message.
3. Use Indian Currency symbol ₹ for amounts.
4. When asked how much was spent on a specific item or category (e.g. "how much spent on grocery"), provide a breakdown comparing This Week, This Month, and All-Time totals, and ask the user which period option they want to explore.\`;

    const contents = [
      { parts: [{ text: systemPrompt }] },
      ...(history || []).map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const models = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash-lite'];
    let lastErr = 'AI Error';

    for (const m of models) {
      try {
        const directRes = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${m}:generateContent?key=\${apiKey}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });
        const data = await directRes.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          let replyText = data.candidates[0].content.parts[0].text;
          let expenseAdded = false;
          let actionData: any = null;

          const jsonMatch = replyText.match(/\\\`\\\`\\\`json\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\`/) || replyText.match(/(\\{[\\s\\S]*?"ACTION"\\s*:\\s*".*?"[\\s\\S]*?\\})/);
          if (jsonMatch) {
            try {
              actionData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch (err) {
              console.error(err);
            }
          }

          if (!actionData) {
            const match1 = message.match(/(?:spent|add|log|bought|paid)\\s+(?:₹\\s*)?(\\d+)\\s+(?:on|for)?\\s*([a-zA-Z0-9\\s]+)/i);
            const match2 = message.match(/(?:spent|add|log|bought|paid)\\s+([a-zA-Z0-9\\s]+)\\s+(?:₹\\s*)?(\\d+)/i);

            const walletCount = contextData?.wallets?.length || 0;
            if (match1) {
              actionData = {
                ACTION: walletCount >= 2 ? 'SELECT_WALLET_FOR_EXPENSE' : 'ADD_EXPENSE',
                amount: Number(match1[1]),
                note: match1[2].trim(),
                category: 'Dining'
              };
            } else if (match2) {
              actionData = {
                ACTION: walletCount >= 2 ? 'SELECT_WALLET_FOR_EXPENSE' : 'ADD_EXPENSE',
                amount: Number(match2[2]),
                note: match2[1].trim(),
                category: 'Dining'
              };
            }
          }

          if (actionData) {
            try {
              const walletCount = contextData?.wallets?.length || 0;
              if (actionData.ACTION === 'SELECT_WALLET_FOR_EXPENSE' && walletCount >= 2) {
                replyText = replyText.replace(/\\\`\\\`\\\`json[\\s\\S]*?\\\`\\\`\\\`/g, '').replace(/\\{[\\s\\S]*?"ACTION"\\s*:\\s*".*?"[\\s\\S]*?\\}/g, '').trim();
                return {
                  answer: replyText || \`Which wallet should I add **\${actionData.note || 'Expense'} (₹\${actionData.amount})** to?\`,
                  walletPrompt: {
                    amount: actionData.amount,
                    category: actionData.category || 'Dining',
                    note: actionData.note || 'Expense'
                  }
                };
              }

              if (actionData && actionData.ACTION === 'ADD_EXPENSE' && actionData.amount > 0) {
                const defaultWallet = contextData?.wallets?.[0]?.id || undefined;
                await api.addExpense({
                  amount: Number(actionData.amount),
                  category: actionData.category || 'Personal',
                  note: actionData.note || 'Logged via ExpenseHub AI',
                  walletId: defaultWallet
                });
                expenseAdded = true;
                replyText = replyText.replace(/\\\`\\\`\\\`json[\\s\\S]*?\\\`\\\`\\\`/g, '').replace(/\\{[\\s\\S]*?"ACTION"\\s*:\\s*"ADD_EXPENSE"[\\s\\S]*?\\}/g, '').trim();
                if (!replyText) {
                  replyText = \`✅ **Successfully Added \${actionData.note || 'Expense'}!**\\n💰 Amount: ₹\${actionData.amount}\`;
                } else if (!replyText.includes('✅')) {
                  replyText += \`\\n\\n✅ *Record saved to MongoDB Audit Trail!*\`;
                }
              }
            } catch (err) {
              console.error('Failed fallback AI action parse:', err);
            }
          }

          return { answer: replyText, expenseAdded };
        } else if (data.error) {
          lastErr = data.error.message;
        }
      } catch (err: any) {
        lastErr = err.message || 'Network error';
      }
    }
    throw new Error(lastErr);
  }
};`;

let code = fs.readFileSync('src/api.ts', 'utf8');
const startIndex = code.indexOf('  askAIChat: async (message: string, history: any[], contextData?: any)');
const endIndex = code.lastIndexOf('};');

code = code.substring(0, startIndex) + oldAskAIChat + "\n";
fs.writeFileSync('src/api.ts', code);
