const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const models = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'];
  
  for (const m of models) {
    console.log(`Testing model: ${m}...`);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
      });
      const data = await res.json();
      if (data.error) {
        console.log(`❌ Failed with ${m}:`, data.error.message);
      } else {
        console.log(`✅ Success with ${m}!`);
      }
    } catch (e) {
      console.log(`❌ Error with ${m}:`, e.message);
    }
  }
}
test();
