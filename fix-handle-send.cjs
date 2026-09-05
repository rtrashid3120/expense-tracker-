const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const oldHandleSend = `
  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputMsg;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
`;

const newHandleSend = `
  const handleSend = async (textToSend?: string) => {
    let query = textToSend || inputMsg;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Inject conversational context
    const lastAiMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastAiMsg?.sender === 'ai' && lastAiMsg.pendingContext) {
      const hasStrongVerb = /\\b(delete|deleted|remove|removed|cancel|canceled|cancelled|undo|erase|erased|drop|dropped|clear|cleared|trash|trashed|wipe|wiped|destroy|destroyed|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm|change|move|shift|update|alter|modify|edit|fix|adjust|correct|set|spend|spent|spending|add|log|bought|paid|pay|bill|purchase|purchased|entry|record|deduct|cost|charge|transfer)\\b/i.test(query);
      if (!hasStrongVerb) {
        query = lastAiMsg.pendingContext.originalQuery + " " + query;
      }
    }
`;

code = code.replace(oldHandleSend.trim(), newHandleSend.trim());

// We also need to change `const query =` to `let query =` if there are any other declarations... wait, I just did `let query =`. But wait, in the old code `const query` was replaced. So we're good.

fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
