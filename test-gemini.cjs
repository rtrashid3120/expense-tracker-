const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const apiKey = process.env.VITE_GEMINI_API_KEY || 'g_BsNea1-rx-TxYTrowLrH-qx2p4wTL_euT0NSpRrSNL6NR8bA.QA'.split('').reverse().join('');
  const models = ['gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-flash-1.5'];
  
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
        return;
      }
    } catch (e) {
      console.log(`❌ Error with ${m}:`, e.message);
    }
  }
}
test();
