const q3 = "change the 500 rent to 600";
const isAmountModifyIntent = q3.match(/\b(?:change|update|edit|alter|modify|fix)\b.*?\b(?:the|my)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s+(.*?)(?:\s+(?:expense|spending|transaction|bill))?\s+\bto\b\s+(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i);
if (isAmountModifyIntent) {
  console.log("Amt: ", { old: isAmountModifyIntent[1], note: isAmountModifyIntent[2], new: isAmountModifyIntent[3] });
}
