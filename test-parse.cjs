const query = "spent 30 on banana , 40 on curd , on sep 20";
const rawClauses = query.split(/,|\band\b|&/i).map(s => s.trim()).filter(Boolean);
for (const clause of rawClauses) {
  const numMatch = clause.match(/(\d+)/);
  if (!numMatch) continue;
  const amount = Number(numMatch[1]);
  let note = clause
    .replace(/(\d+(?:\.\d+)?)/g, '')
    .replace(/\b(spend|spending|spent|cost|gave|took|charge|charged|purchase|purchased|add|log|bought|paid|on|for|at|in|to|from|rupees|rs|inr|bucks|₹)\b/gi, '')
    .replace(/[^\w\s-]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  console.log(`Amount: ${amount}, Note: ${note}`);
}
