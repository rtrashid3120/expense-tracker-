const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const systemPrompt = `You are ExpenseHub AI, a smart, friendly, personal financial assistant inside ExpenseHub.

- To NAVIGATE to a specific page (dashboard, reports/heatmaps, trips, profile, expenses/audit):
\`\`\`json
{
  "ACTION": "NAVIGATE",
  "page": "/reports"
}
\`\`\`
`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      system_instruction: { parts: { text: systemPrompt } },
      contents: [{ role: 'user', parts: [{ text: "take me to the heatmaps" }] }] 
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
