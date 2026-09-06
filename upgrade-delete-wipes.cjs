const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const anchor = `      // Find targets that match criteria
      const matchedTargets = validExpenses.filter(e => {
        const matchDate = targetDate ? (e.date && e.date.startsWith(targetDate)) : true;
        const matchAmount = amount ? e.amount === amount : true;
        const matchNote = cleanNote ? ((e.note || '').toLowerCase().includes(cleanNote.toLowerCase()) || (e.category || '').toLowerCase().includes(cleanNote.toLowerCase())) : true;
        
        // We only require what was explicitly found. If they only provided a note, we match by note. 
        // If they provided note + date, we match both.
        return matchDate && matchAmount && matchNote;
      });`;

const newCode = `      // Find targets that match criteria
      const matchedTargets = validExpenses.filter(e => {
        const matchDate = targetDate ? (e.date && e.date.startsWith(targetDate)) : true;
        const matchAmount = amount ? e.amount === amount : true;
        const matchNote = cleanNote ? ((e.note || '').toLowerCase().includes(cleanNote.toLowerCase()) || (e.category || '').toLowerCase().includes(cleanNote.toLowerCase())) : true;
        return matchDate && matchAmount && matchNote;
      });

      // FEATURE: Date Wipe & Global Wipe
      // If the user didn't specify a note or amount, they are trying to do a bulk wipe!
      // Examples: "delete all", "delete yesterday", "remove everything"
      const isGlobalWipe = /\\b(all|every|evry|everything|evrything|entire|whole)\\b/i.test(query);
      
      if (!cleanNote && !amount && matchedTargets.length > 0) {
         // To prevent accidental deletion if they just type "delete", require either a Date OR a Global Wipe keyword.
         if (targetDate || isGlobalWipe) {
            try {
               const deletedList = matchedTargets.map(t => ({ ...t }));
               for (const t of matchedTargets) {
                 const tId = t.id || (t as any)._id;
                 await api.deleteExpense(tId);
               }
               await fetchData(true);
               const aiMessage: ChatMessage = {
                 id: (Date.now() + 1).toString(), sender: 'ai',
                 text: \`🗑️ **Bulk Deletion Complete!**\\n\\nI successfully deleted **\${matchedTargets.length} records**\${targetDate ? \` on \${targetDate}\` : ''}.\`,
                 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 undoPayload: { action: 'RESTORE_EXPENSES', expenses: deletedList }
               };
               setMessages(prev => [...prev, aiMessage]);
               return;
            } catch(e) { console.error(e); }
         }
      }`;

code = code.replace(anchor, newCode);
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
