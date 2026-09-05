const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      system_instruction: { parts: { text: "You are an expense tracker AI." } },
      contents: [{ role: 'user', parts: [{ text: "take me to heatmaps" }] }] 
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
