const fs = require('fs');
let content = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

// 1. Bulk Date Transfer
content = content.replace(
  /for \(const t of targets\) \{\s*const tId = t\.id \|\| \(t as any\)\._id;\s*await api\.updateExpense\(tId, \{ date: toDate \}\);\s*\}/,
  `const undoUpdates = targets.map(t => ({ id: t.id || (t as any)._id, oldData: { date: t.date } }));
            for (const t of targets) {
              const tId = t.id || (t as any)._id;
              await api.updateExpense(tId, { date: toDate });
            }`
);
content = content.replace(
  /text: \`📅 \*\*Bulk Date Transfer Complete!\*\*\\n\\nI successfully shifted \*\*\$\{targets\.length\} expenses\*\* from \$\{bulkDateMatch\[1\]\} to \$\{bulkDateMatch\[2\]\}\.\`,\s*timestamp: new Date\(\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\s*\};/g,
  `text: \`📅 **Bulk Date Transfer Complete!**\\n\\nI successfully shifted **\${targets.length} expenses** from \${bulkDateMatch[1]} to \${bulkDateMatch[2]}.\`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              undoPayload: { action: 'REVERT_UPDATE', updates: undoUpdates }
            };`
);

// 2. Bulk Category Update
content = content.replace(
  /for \(const t of targets\) \{\s*const tId = t\.id \|\| \(t as any\)\._id;\s*await api\.updateExpense\(tId, \{ category: targetCategory as any \}\);\s*\}/,
  `const undoUpdatesCat = targets.map(t => ({ id: t.id || (t as any)._id, oldData: { category: t.category } }));
          for (const t of targets) {
            const tId = t.id || (t as any)._id;
            await api.updateExpense(tId, { category: targetCategory as any });
          }`
);
content = content.replace(
  /text: \`🗂️ \*\*Bulk Category Update Complete!\*\*\\n\\nI successfully moved \*\*\$\{targets\.length\} "\$\{itemSearch\}" records\*\* to the \*\*\$\{targetCategory\}\*\* category\.\`,\s*timestamp: new Date\(\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\s*\};/g,
  `text: \`🗂️ **Bulk Category Update Complete!**\\n\\nI successfully moved **\${targets.length} "\${itemSearch}" records** to the **\${targetCategory}** category.\`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            undoPayload: { action: 'REVERT_UPDATE', updates: undoUpdatesCat }
          };`
);

// 3. Single Amount Update
content = content.replace(
  /const tId = target\.id \|\| \(target as any\)\._id;\s*await api\.updateExpense\(tId, \{ amount: newAmount \}\);/,
  `const tId = target.id || (target as any)._id;
          const undoSingleUpdate = { id: tId, oldData: { amount: target.amount } };
          await api.updateExpense(tId, { amount: newAmount });`
);
content = content.replace(
  /text: \`✅ \*\*Expense Amount Fixed!\*\*\\n\\nI successfully updated your "\$\{target\.note \|\| target\.category\}" record from ₹\$\{oldAmount\} to \*\*₹\$\{newAmount\}\*\*\.\`,\s*timestamp: new Date\(\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\s*\};/g,
  `text: \`✅ **Expense Amount Fixed!**\\n\\nI successfully updated your "\${target.note || target.category}" record from ₹\${oldAmount} to **₹\${newAmount}**.\`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            undoPayload: { action: 'REVERT_UPDATE', updates: [undoSingleUpdate] }
          };`
);

// 4. Bulk Deletion
content = content.replace(
  /for \(const t of targets\) \{\s*const tId = t\.id \|\| \(t as any\)\._id;\s*await api\.deleteExpense\(tId\);\s*\}/,
  `const deletedExpensesList = targets.map(t => ({ ...t }));
            for (const t of targets) {
              const tId = t.id || (t as any)._id;
              await api.deleteExpense(tId);
            }`
);
content = content.replace(
  /text: \`🗑️ \*\*Bulk Deletion Complete!\*\*\\n\\nI successfully deleted \*\*\$\{targets\.length\} records\*\* matching "\$\{cleanNote\}"\.\`,\s*timestamp: new Date\(\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\s*\};/g,
  `text: \`🗑️ **Bulk Deletion Complete!**\\n\\nI successfully deleted **\${targets.length} records** matching "\${cleanNote}".\`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              undoPayload: { action: 'RESTORE_EXPENSES', expenses: deletedExpensesList }
            };`
);

// 5. Single Deletion
content = content.replace(
  /const targetId = target\.id \|\| \(target as any\)\._id;\s*await api\.deleteExpense\(targetId\);\s*await fetchData\(true\);/,
  `const targetId = target.id || (target as any)._id;
          const singleDeletedExpense = { ...target };
          await api.deleteExpense(targetId);
          await fetchData(true);`
);
content = content.replace(
  /text: \`✅ \*\*Successfully Deleted Expense!\*\*\\n- Item: \$\{target\.note \|\| 'Expense'\}\\n- Amount: ₹\$\{target\.amount\}\\n- Category: \$\{target\.category\}\`,\s*timestamp: new Date\(\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\s*\};/g,
  `text: \`✅ **Successfully Deleted Expense!**\\n- Item: \${target.note || 'Expense'}\\n- Amount: ₹\${target.amount}\\n- Category: \${target.category}\`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            undoPayload: { action: 'RESTORE_EXPENSES', expenses: [singleDeletedExpense] }
          };`
);

fs.writeFileSync('src/components/AIChatDrawer.tsx', content, 'utf8');
