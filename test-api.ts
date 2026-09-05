import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: "hello" }] }] })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
