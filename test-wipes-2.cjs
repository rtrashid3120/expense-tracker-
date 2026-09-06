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
    } else {
        const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
        const dayMonthRegex = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}\\b`, 'i');
        const monthDayRegex = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
        
        const dMatch = cleanQuery.match(dayMonthRegex) || cleanQuery.match(monthDayRegex);
        if (dMatch) {
            targetDate = 'explicit_date';
            cleanQuery = cleanQuery.replace(dMatch[0], ' ');
        }
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

assert.strictEqual(testDelete("remove everything from sep 20").mode, 'wipe');
assert.strictEqual(testDelete("delete everything from sep 20").mode, 'wipe');
assert.strictEqual(testDelete("delete all , remove all sep 20").mode, 'wipe');

console.log("✅ NEW WIPE TESTS PASSED!");
