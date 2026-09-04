const q2 = "switch evrything apple to tech";
const bulkCatMatch = q2.match(/\b(?:change|move|update|transfer|switch|alter|modify|migrate|assign|set)\b.*?\b(?:all|every|evry|everything|evrything|the|those|my)?\b\s*(.*?)(?:\s+(?:expenses|spending|spendings|transactions|items|bills|records|data))?\s+\bto\b\s+(.*)/i);
if (bulkCatMatch && bulkCatMatch[1].trim()) {
  const itemSearch = bulkCatMatch[1].toLowerCase().trim().replace(/\b(?:expenses|spending|spendings|transactions|items|bills|records|data|all|every|evry|everything|evrything|the|those|my)\b/gi, '').trim();
  const targetCategoryRaw = bulkCatMatch[2].toLowerCase().trim().replace(/category/i, '').trim();
  const targetCategory = targetCategoryRaw.charAt(0).toUpperCase() + targetCategoryRaw.slice(1);
  console.log("Cat Shift: ", { itemSearch, targetCategory });
}
