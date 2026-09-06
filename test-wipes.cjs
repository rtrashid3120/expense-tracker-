const assert = require('assert');

function testDelete(query) {
    let cleanQuery = query;
    let targetDate = null;
    const now = new Date();
    
    if (/\btoday\b/i.test(cleanQuery)) {
        targetDate = 'today';
        cleanQuery = cleanQuery.replace(/\b(?:on\s+|from\s+|for\s+|in\s+)?(?:today)\b/gi, ' ');
    } else if (/\byesterday\b/i.test(cleanQuery)) {
        targetDate = 'yesterday';
        cleanQuery = cleanQuery.replace(/\b(?:on\s+|from\s+|for\s+|in\s+)?(?:yesterday)\b/gi, ' ');
    }

    const numMatch = cleanQuery.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i);
    const amount = numMatch ? Number(numMatch[1]) : null;
    if (numMatch) cleanQuery = cleanQuery.replace(numMatch[0], ' ');

    const cleanNote = cleanQuery.replace(/\b(delete|deleted|remove|removed|cancel|canceled|cancelled|undo|erase|erased|drop|dropped|clear|cleared|trash|trashed|wipe|wiped|destroy|destroyed|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm|all|every|evry|everything|evrything|the|those|my|these|entire|whole|spent|add|log|bought|paid|on|for|from|in|at|rupees|rs|₹|inr|bucks|spending|spendings|expense|expenses|transaction|transactions|item|items|bill|bills|record|records|data|entry|entries|history|log|logs|purchases|payments|exp|txn|txns|amt|last|latest)\b/gi, '').replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, ' ');

    const isGlobalWipe = /\b(all|every|evry|everything|evrything|entire|whole)\b/i.test(query);

    let mode = 'single';
    if (!cleanNote && !amount) {
        if (targetDate || isGlobalWipe) {
            mode = 'wipe';
        } else {
            mode = 'ambiguous';
        }
    }

    return { mode, cleanNote, amount, targetDate, isGlobalWipe };
}

assert.strictEqual(testDelete("delete coffee").mode, 'single');
assert.strictEqual(testDelete("delete all").mode, 'wipe');
assert.strictEqual(testDelete("delete yesterday").mode, 'wipe');
assert.strictEqual(testDelete("delete all spendings").mode, 'wipe');
assert.strictEqual(testDelete("remove everything").mode, 'wipe');
assert.strictEqual(testDelete("delete").mode, 'ambiguous');

console.log("✅ WIPE TESTS PASSED!");
