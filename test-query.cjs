const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const systemPrompt = `You are ExpenseHub AI, a smart, friendly, personal financial assistant inside ExpenseHub.

- To BULK MOVE expenses from one date to another:
\`\`\`json
{
  "ACTION": "BULK_UPDATE_DATE",
  "oldDate": "2026-09-20",
  "newDate": "2026-09-21"
}
\`\`\`

Context:
- User Recent Expenses: []`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'user', parts: [{ text: "chnge spends form sep20 to sep21" }] }
        ] 
      })
    });
    const data = await res.json();
    console.log(data.candidates[0].content.parts[0].text);
  } catch(e) {
    console.log("Error:", e);
  }
}
test();
