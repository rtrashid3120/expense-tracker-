const fs = require('fs');
let code = fs.readFileSync('src/api.ts', 'utf8');

const oldCode = `
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
        });`;

const newCode = `
    const allHistory = [
      ...(history || []).map(h => ({ role: h.sender === 'user' ? 'user' : 'model', text: h.text })),
      { role: 'user', text: message }
    ];

    const contents = [];
    let lastRole = '';
    for (const h of allHistory) {
      if (h.role !== lastRole) {
        contents.push({ role: h.role, parts: [{ text: h.text }] });
        lastRole = h.role;
      } else if (contents.length > 0) {
        contents[contents.length - 1].parts[0].text += \`\\n\\n\${h.text}\`;
      }
    }

    const models = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash-lite'];
    let lastErr = 'AI Error';

    for (const m of models) {
      try {
        const directRes = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${m}:generateContent?key=\${apiKey}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            system_instruction: { parts: { text: systemPrompt } },
            contents 
          })
        });`;

code = code.replace(oldCode.trim(), newCode.trim());
fs.writeFileSync('src/api.ts', code);
