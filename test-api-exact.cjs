const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const systemPrompt = "test";
  const history = [];
  const message = "take me to heatmaps";
  
  const contents = [
    ...(history || []).map(h => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const models = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash-lite'];
  
  for (const m of models) {
    console.log(`Trying ${m}...`);
    try {
      const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          system_instruction: { parts: { text: systemPrompt } },
          contents 
        })
      });
      const data = await directRes.json();
      console.log(m, directRes.status, data.error ? data.error.message : 'SUCCESS');
    } catch(e) {
      console.log(m, "FETCH ERROR", e);
    }
  }
}
run();
