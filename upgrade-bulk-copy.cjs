const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const oldIntentBlockStart = '    // INTENT 2.5: Bulk Date Transfer ("transfer evrything from sep 20 to sep 21", "move all my spendings from yesterday to today")';
const oldIntentBlockEndMatch = /return;\s*\}\s*else\s*\{\s*const\s*aiMessage[\s\S]*?return;\s*\}\s*\}/;

const oldIntentStr = code.substring(code.indexOf(oldIntentBlockStart), code.indexOf('    // INTENT 3: Single Expense Amount Modification'));

const newIntentStr = `    // INTENT 2.5: Bulk Date Transfer & Copy ("transfer evrything from sep 20 to sep 21", "copy sep 4 to sep 7 except coffee")
    const isCopyAction = /\\b(copy|duplicate|clone|replicate|repeat)\\b/i.test(query);
    const isTransferAction = /\\b(transfer|move|shift|change)\\b/i.test(query);
    
    let isBulkDateAction = false;
    let isCopyMode = false;
    
    if (/\\b(transfer|move|shift|change|copy|duplicate|clone|replicate|repeat)\\b.*\\b(all|every|evry|everything|evrything|spendings|expenses|records|transactions)\\b.*\\b(from|form)?\\b.*\\b(to)\\b/i.test(query)) {
       isBulkDateAction = true;
    }
    
    if (!isBulkDateAction && /\\b(transfer|move|shift|change|copy|duplicate|clone|replicate|repeat)\\b.*\\bto\\b/i.test(query)) {
      const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
      const d1 = new RegExp(\`\\\\b(?:on\\\\s+|from\\\\s+|for\\\\s+|in\\\\s+)?(\\\\d{1,2})(?:st|nd|rd|th)?\\\\s*\${mRegex}\\\\b\`, 'gi');
      const d2 = new RegExp(\`\\\\b(?:on\\\\s+|from\\\\s+|for\\\\s+|in\\\\s+)?\${mRegex}\\\\s*(\\\\d{1,2})(?:st|nd|rd|th)?\\\\b\`, 'gi');
      const d3 = /\\b(yesterday|today|tomorrow)\\b/gi;
      
      const count = [...query.matchAll(d1)].length + [...query.matchAll(d2)].length + [...query.matchAll(d3)].length;
      if (count >= 2) {
        isBulkDateAction = true;
      }
    }
    
    if (isBulkDateAction) {
      isCopyMode = isCopyAction && !isTransferAction; // default to transfer if ambiguous
      
      let cleanQuery = query.toLowerCase().replace(/form\\b/gi, 'from');
      const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
      const dayMonthRegex = new RegExp(\`(?:on\\\\s+|from\\\\s+|for\\\\s+|in\\\\s+)?(\\\\d{1,2})(?:st|nd|rd|th)?\\\\s*\${mRegex}(?:\\\\s+(\\\\d{4}))?\\\\b\`, 'gi');
      const monthDayRegex = new RegExp(\`(?:on\\\\s+|from\\\\s+|for\\\\s+|in\\\\s+)?\${mRegex}\\\\s*(\\\\d{1,2})(?:st|nd|rd|th)?(?:\\\\s+(\\\\d{4}))?\\\\b\`, 'gi');
      const relativeRegex = /\\b(?:from\\\\s+|to\\\\s+|on\\\\s+)?(yesterday|today|tomorrow)\\b/gi;
      
      const dm = [...cleanQuery.matchAll(dayMonthRegex)];
      const md = [...cleanQuery.matchAll(monthDayRegex)];
      const rel = [...cleanQuery.matchAll(relativeRegex)];
      
      const allDates: any[] = [];
      const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const parseMonth = (mStr: string) => {
        let str = mStr.toLowerCase();
        if (str.startsWith('spe')) str = 'sep';
        if (str.startsWith('augu')) str = 'aug';
        if (str.startsWith('jne')) str = 'jun';
        if (str.startsWith('jlu')) str = 'jul';
        return months.findIndex(m => str.startsWith(m));
      };

      for (const match of dm) {
        const monthIdx = parseMonth(match[2]);
        if (monthIdx !== -1) {
          allDates.push({ matchStr: match[0], index: match.index, day: parseInt(match?.[1] || "0"), month: monthIdx, year: match[3] ? parseInt(match[3]) : new Date().getFullYear() });
        }
      }
      for (const match of md) {
        const monthIdx = parseMonth(match[1]);
        if (monthIdx !== -1) {
          allDates.push({ matchStr: match[0], index: match.index, day: parseInt(match[2]), month: monthIdx, year: match[3] ? parseInt(match[3]) : new Date().getFullYear() });
        }
      }
      for (const match of rel) {
        const word = match[1].toLowerCase();
        const d = new Date();
        if (word === 'yesterday') d.setDate(d.getDate() - 1);
        if (word === 'tomorrow') d.setDate(d.getDate() + 1);
        allDates.push({ matchStr: match[0], index: match.index, day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
      }

      allDates.sort((a, b) => (a.index || 0) - (b.index || 0));

      if (allDates.length >= 2) {
        const fromDateObj = allDates[0];
        const toDateObj = allDates[1];
        
        const fromDateStr = \`\${fromDateObj.year}-\${String(fromDateObj.month+1).padStart(2,'0')}-\${String(fromDateObj.day).padStart(2,'0')}\`;
        const toDateStr = \`\${toDateObj.year}-\${String(toDateObj.month+1).padStart(2,'0')}-\${String(toDateObj.day).padStart(2,'0')}\`;

        // Check for exclusions ("except coffee", "excluding swiggy")
        let exclusionKeywords: string[] = [];
        const exceptMatch = query.match(/\\b(?:except|excluding|without|but not|other than|excepting)\\b\\s+(.+)/i);
        if (exceptMatch) {
            exclusionKeywords = exceptMatch[1].toLowerCase().replace(/[^\\w\\s-]/gi, '').split(' ').filter(w => w.trim().length > 2);
        }

        const targets = validExpenses.filter(e => {
            if (!e.date || !e.date.startsWith(fromDateStr)) return false;
            
            // Check exclusion keywords
            if (exclusionKeywords.length > 0) {
                const note = (e.note || '').toLowerCase();
                const cat = (e.category || '').toLowerCase();
                if (exclusionKeywords.some(kw => note.includes(kw) || cat.includes(kw))) {
                    return false; // Skip this one!
                }
            }
            return true;
        });

        if (targets.length > 0) {
          try {
            if (isCopyMode) {
               const copiedExpensesList = [];
               for (const t of targets) {
                 const newExp = {
                   amount: t.amount,
                   category: t.category,
                   note: t.note,
                   date: toDateStr + 'T12:00:00Z',
                   walletId: t.walletId
                 };
                 await api.addExpense(newExp);
                 copiedExpensesList.push(newExp);
               }
               await fetchData(true);
               const aiMessage: ChatMessage = {
                 id: (Date.now() + 1).toString(), sender: 'ai',
                 text: \`📋 **Bulk Date Copy Complete!**\\n\\nI successfully copied **\${targets.length} records** from **\${fromDateStr}** to **\${toDateStr}**.\${exclusionKeywords.length > 0 ? \`\\n\\n*(Excluded items matching: \${exclusionKeywords.join(', ')})*\` : ''}\`,
                 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
               };
               setMessages(prev => [...prev, aiMessage]);
               return;
            } else {
              const undoUpdatesDate = [];
              for (const t of targets) {
                const tId = t.id || (t as any)._id;
                undoUpdatesDate.push({ id: tId, oldData: { date: t.date } });
                await api.updateExpense(tId, { date: toDateStr + 'T12:00:00Z' });
              }
              await fetchData(true);
              const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(), sender: 'ai',
                text: \`📅 **Bulk Date Transfer Complete!**\\n\\nI successfully moved **\${targets.length} records** from **\${fromDateStr}** to **\${toDateStr}**.\${exclusionKeywords.length > 0 ? \`\\n\\n*(Excluded items matching: \${exclusionKeywords.join(', ')})*\` : ''}\`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                undoPayload: { action: 'REVERT_UPDATE', updates: undoUpdatesDate }
              };
              setMessages(prev => [...prev, aiMessage]);
              return;
            }
          } catch(e) { console.error(e); }
        } else {
            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              sender: 'ai',
              text: \`📅 **No Expenses Found**\\n\\nI couldn't find any expenses on **\${fromDateStr}** to \${isCopyMode ? 'copy' : 'transfer'}.\`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
        }
      }
    }
`;

code = code.replace(oldIntentStr, newIntentStr + '\n');
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
