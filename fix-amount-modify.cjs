const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const oldBlock = `
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
`;

const newBlock = `
        let matchedTargets = validExpenses.filter(e => {
          const matchDate = targetDate ? (e.date && e.date.startsWith(targetDate)) : true;
          const matchAmount = e.amount === oldAmount;
          const matchNote = cleanNote ? ((e.note || '').toLowerCase().includes(cleanNote) || (e.category || '').toLowerCase().includes(cleanNote)) : true;
          return matchDate && matchAmount && matchNote;
        });

        let target = null;
        if (matchedTargets.length === 1) {
          target = matchedTargets[0];
        } else if (matchedTargets.length > 1) {
          const exactNoteMatch = matchedTargets.filter(e => (e.note || '').toLowerCase() === cleanNote.toLowerCase());
          if (exactNoteMatch.length === 1) target = exactNoteMatch[0];
          else {
            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(), sender: 'ai',
              pendingContext: { originalQuery: query },
              text: \`⚠️ **Multiple Matches Found**\\n\\nI found \${matchedTargets.length} expenses matching that description. Please be more specific (e.g., provide the exact date like "yesterday").\`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          }
        } else {
           const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(), sender: 'ai',
              text: \`⚠️ **Couldn't find expense to update**\\n\\nI searched for: \${cleanNote ? \`"\${cleanNote}"\` : ''} ₹\${oldAmount} \${targetDate ? \`on \${targetDate}\` : ''}\`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
        }

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
`;

code = code.replace(oldBlock.trim(), newBlock.trim());
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
