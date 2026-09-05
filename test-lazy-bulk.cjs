const assert = require('assert');

function test(query) {
    let isBulkDateTransfer = /\b(transfer|move|shift|change)\b.*\b(all|every|evry|everything|evrything|spendings|expenses|records|transactions)\b.*\b(from|form)?\b.*\b(to)\b/i.test(query);
    
    if (!isBulkDateTransfer && /\b(transfer|move|shift|change)\b.*\bto\b/i.test(query)) {
      const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
      const d1 = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}\\b`, 'gi');
      const d2 = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'gi');
      const d3 = /\b(yesterday|today|tomorrow)\b/gi;
      
      const count = [...query.matchAll(d1)].length + [...query.matchAll(d2)].length + [...query.matchAll(d3)].length;
      if (count >= 2) {
        isBulkDateTransfer = true;
      }
    }
    return isBulkDateTransfer;
}

assert.strictEqual(test("transfer sep 3 to sep 4"), true, "Failed: transfer sep 3 to sep 4");
assert.strictEqual(test("move yesterday to today"), true, "Failed: move yesterday to today");
assert.strictEqual(test("change rent to 600"), false, "Failed: Amount Mod shouldn't trigger");
assert.strictEqual(test("change 500 rent to 600 on sep 20"), false, "Failed: Amount Mod shouldn't trigger with one date");
assert.strictEqual(test("transfer everything from sep 3 to sep 4"), true, "Failed: Explicit rule broke");

console.log("✅ ALL LAZY BULK DATE TESTS PASSED!");
