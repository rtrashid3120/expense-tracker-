const fs = require('fs');
let content = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

if (!content.includes('interface UndoPayload')) {
  content = content.replace(
    /interface ChatMessage \{/,
    `interface UndoPayload {
  action: 'RESTORE_EXPENSES' | 'REVERT_UPDATE';
  expenses?: any[];
  updates?: { id: string, oldData: any }[];
}

interface ChatMessage {`
  );
}

if (!content.includes('undoPayload?: UndoPayload;')) {
  content = content.replace(
    /optionGroups\?: OptionGroup\[\];\n\}/,
    `optionGroups?: OptionGroup[];
  undoPayload?: UndoPayload;
  isUndone?: boolean;
}`
  );
}

if (!content.includes('const handleUndo = async (msgId: string)')) {
  content = content.replace(
    /const handleClear = \(\) => \{/,
    `const handleUndo = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.undoPayload || msg.isUndone) return;

    try {
      if (msg.undoPayload.action === 'RESTORE_EXPENSES' && msg.undoPayload.expenses) {
        for (const e of msg.undoPayload.expenses) {
          const { id, _id, ...rest } = e;
          await api.addExpense(rest);
        }
      } else if (msg.undoPayload.action === 'REVERT_UPDATE' && msg.undoPayload.updates) {
        for (const u of msg.undoPayload.updates) {
          await api.updateExpense(u.id, u.oldData);
        }
      }
      
      await fetchData(true);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isUndone: true, text: m.text + '\\n\\n↩️ **Action Reversed Successfully!**' } : m));
    } catch (err: any) {
      alert('Failed to undo: ' + err.message);
    }
  };

  const handleClear = () => {`
  );
}

// Inject undo UI
if (!content.includes('↩️ Undo Action')) {
  content = content.replace(
    /\{\/\* Interactive Timeframe Option Buttons \*\/\}/,
    `{/* Undo Button */}
                      {msg.undoPayload && !msg.isUndone && (
                        <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-white/10 space-y-2">
                          <button
                            type="button"
                            onClick={() => handleUndo(msg.id)}
                            className="px-3 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                          >
                            ↩️ Undo Action
                          </button>
                        </div>
                      )}

                      {/* Interactive Timeframe Option Buttons */}`
  );
}

fs.writeFileSync('src/components/AIChatDrawer.tsx', content, 'utf8');
