const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const oldIntent3 = `    // INTENT 3: Single Expense Amount Modification ("change the 500 rent to 600", "update 1200 groceries to 1500")
    const isAmountModifyIntent = query.match(/\\b(?:change|move|shift|transfer|update|switch|alter|modify|migrate|swap|convert|reassign|relocate|push|revert|transition|transform|reallocate|edit|fix|adjust|correct|set|make)\\b.*?\\b(?:the|my|this|that|those|these)?\\s*(?:rs\\.?|₹|inr|rupees|bucks)?\\s*(\\d+(?:\\.\\d+)?)\\s+(.*?)(?:\\s+(?:spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt))?\\s+\\bto\\b\\s+(?:rs\\.?|₹|inr|rupees|bucks)?\\s*(\\d+(?:\\.\\d+)?)/i);
    if (isAmountModifyIntent) {
      const oldAmount = Number(isAmountModifyIntent[1]);
      const cleanNote = isAmountModifyIntent[2].replace(/[^\\w\\s-]/gi, '').trim().toLowerCase();
      const newAmount = Number(isAmountModifyIntent[3]);
      
      let target = validExpenses.find(e => e.amount === oldAmount && ((e.note || '').toLowerCase().includes(cleanNote) || (e.category || '').toLowerCase().includes(cleanNote)));
      if (target) {
        try {
          const tId = target.id || (target as any)._id;
          const undoSingleUpdate = { id: tId, oldData: { amount: target.amount } };
          await api.updateExpense(tId, { amount: newAmount });
          await fetchData(true);
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(), sender: 'ai',
            text: \`✅ **Expense Amount Fixed!**\\n\\nI successfully updated your "\${target.note || target.category}" record from ₹\${oldAmount} to **₹\${newAmount}**.\`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            undoPayload: { action: 'REVERT_UPDATE', updates: [undoSingleUpdate] }
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        } catch(e) { console.error(e); }
      }
    }`;

const newIntent3 = `    // INTENT 3: Single Expense Amount Modification ("change the 500 on cofee to 600 on aug 20", "update 1200 groceries to 1500")
    const isAmountModifyAction = /\\b(?:change|move|shift|update|alter|modify|edit|fix|adjust|correct|set)\\b/i.test(query) && /\\bto\\b/i.test(query);
    if (isAmountModifyAction && !isBulkDateTransfer) {
      let cleanQuery = query.toLowerCase();
      let targetDate: string | null = null;
      
      // 1. Extract Date
      const now = new Date();
      if (/\\b(?:today)\\b/i.test(cleanQuery)) {
        targetDate = \`\${now.getFullYear()}-\${String(now.getMonth()+1).padStart(2,'0')}-\${String(now.getDate()).padStart(2,'0')}\`;
        cleanQuery = cleanQuery.replace(/\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?(?:today)\\b/gi, ' ');
      } else if (/\\b(?:yesterday)\\b/i.test(cleanQuery)) {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        targetDate = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
        cleanQuery = cleanQuery.replace(/\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?(?:yesterday)\\b/gi, ' ');
      } else if (/\\b(?:day before yesterday)\\b/i.test(cleanQuery)) {
        const d = new Date(now);
        d.setDate(d.getDate() - 2);
        targetDate = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
        cleanQuery = cleanQuery.replace(/\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?(?:day before yesterday)\\b/gi, ' ');
      } else if (/(\\d+)\\s+days?\\s+ago/i.test(cleanQuery)) {
        const match = cleanQuery.match(/(\\d+)\\s+days?\\s+ago/i);
        if (match) {
          const d = new Date(now);
          d.setDate(d.getDate() - parseInt(match[1]));
          targetDate = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
          cleanQuery = cleanQuery.replace(/(\\d+)\\s+days?\\s+ago/gi, ' ');
        }
      } else {
        const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
        const dayMonthRegex = new RegExp(\`\\\\b(?:on\\\\s+|from\\\\s+|for\\\\s+|in\\\\s+)?(\\\\d{1,2})(?:st|nd|rd|th)?\\\\s*\${mRegex}\\\\b\`, 'i');
        const monthDayRegex = new RegExp(\`\\\\b(?:on\\\\s+|from\\\\s+|for\\\\s+|in\\\\s+)?\${mRegex}\\\\s*(\\\\d{1,2})(?:st|nd|rd|th)?\\\\b\`, 'i');
        
        const dMatch = cleanQuery.match(dayMonthRegex) || cleanQuery.match(monthDayRegex);
        if (dMatch) {
          const isDayFirst = !isNaN(parseInt(dMatch[1]));
          let dayStr = isDayFirst ? dMatch[1] : dMatch[2];
          let monthStr = isDayFirst ? dMatch[2] : dMatch[1];
          
          const day = parseInt(dayStr);
          const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
          if (monthStr.toLowerCase().startsWith('spe')) monthStr = 'sep';
          if (monthStr.toLowerCase().startsWith('augu')) monthStr = 'aug';
          if (monthStr.toLowerCase().startsWith('jne')) monthStr = 'jun';
          if (monthStr.toLowerCase().startsWith('jlu')) monthStr = 'jul';
          
          const monthIdx = months.findIndex(x => monthStr.toLowerCase().startsWith(x));
          if (monthIdx !== -1 && day >= 1 && day <= 31) {
            const d = new Date(new Date().getFullYear(), monthIdx, day);
            targetDate = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
            cleanQuery = cleanQuery.replace(dMatch[0], ' ');
          }
        }
      }

      // 2. Extract the two amounts ("change ... 500 ... to ... 600")
      // Match exactly two numbers separated by the word "to"
      // Also handles "change coffee 500 to 600"
      const amountsMatch = cleanQuery.match(/(?:rs\\.?|₹|inr|rupees)?\\s*(\\d+(?:\\.\\d+)?)\\b.*?\\bto\\b.*?(?:rs\\.?|₹|inr|rupees)?\\s*(\\d+(?:\\.\\d+)?)\\b/i);
      
      if (amountsMatch) {
        const oldAmount = Number(amountsMatch[1]);
        const newAmount = Number(amountsMatch[2]);
        
        // Remove the amounts and action words from query to get the clean note
        cleanQuery = cleanQuery.replace(amountsMatch[1], ' ').replace(amountsMatch[2], ' ');
        const cleanNote = cleanQuery.replace(/\\b(change|move|shift|update|alter|modify|edit|fix|adjust|correct|set|to|from|on|for|in|at|the|my|this|that|those|these|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt)\\b/gi, '').replace(/[^\\w\\s-]/gi, '').trim().replace(/\\s+/g, ' ');

        let target = validExpenses.find(e => {
          const matchDate = targetDate ? (e.date && e.date.startsWith(targetDate)) : true;
          const matchAmount = e.amount === oldAmount;
          const matchNote = cleanNote ? ((e.note || '').toLowerCase().includes(cleanNote) || (e.category || '').toLowerCase().includes(cleanNote)) : true;
          return matchDate && matchAmount && matchNote;
        });

        if (target) {
          try {
            const tId = target.id || (target as any)._id;
            const undoSingleUpdate = { id: tId, oldData: { amount: target.amount } };
            await api.updateExpense(tId, { amount: newAmount });
            await fetchData(true);
            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(), sender: 'ai',
              text: \`✅ **Expense Amount Fixed!**\\n\\nI successfully updated your "\${target.note || target.category}" record\${targetDate ? \` on \${targetDate}\` : ''} from ₹\${oldAmount} to **₹\${newAmount}**.\`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              undoPayload: { action: 'REVERT_UPDATE', updates: [undoSingleUpdate] }
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          } catch(e) { console.error(e); }
        }
      }
    }`;

code = code.replace(oldIntent3.trim(), newIntent3.trim());
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
