const assert = require('assert');

function testCopy(query) {
    const isCopyAction = /\b(copy|duplicate|clone|replicate|repeat)\b/i.test(query);
    const isTransferAction = /\b(transfer|move|shift|change)\b/i.test(query);
    
    let isBulkDateAction = false;
    let isCopyMode = false;
    
    if (/\b(transfer|move|shift|change|copy|duplicate|clone|replicate|repeat)\b.*\b(all|every|evry|everything|evrything|spendings|expenses|records|transactions)\b.*\b(from|form)?\b.*\b(to)\b/i.test(query)) {
       isBulkDateAction = true;
    }
    
    if (!isBulkDateAction && /\b(transfer|move|shift|change|copy|duplicate|clone|replicate|repeat)\b.*\bto\b/i.test(query)) {
      const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe|augu|jne|jlu)";
      const d1 = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}\\b`, 'gi');
      const d2 = new RegExp(`\\b(?:on\\s+|from\\s+|for\\s+|in\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'gi');
      const d3 = /\b(yesterday|today|tomorrow)\b/gi;
      
      const count = [...query.matchAll(d1)].length + [...query.matchAll(d2)].length + [...query.matchAll(d3)].length;
      if (count >= 2) {
        isBulkDateAction = true;
      }
    }
    
    if (isBulkDateAction) {
       isCopyMode = isCopyAction && !isTransferAction;
       let exclusionKeywords = [];
       const exceptMatch = query.match(/\b(?:except|excluding|without|but not|other than|excepting)\b\s+(.+)/i);
       if (exceptMatch) {
            exclusionKeywords = exceptMatch[1].toLowerCase().replace(/[^\w\s-]/gi, '').split(' ').filter(w => w.trim().length > 2);
       }
       return { mode: isCopyMode ? 'copy' : 'transfer', exclusions: exclusionKeywords };
    }
    return null;
}

function testAnalytics(query) {
    const isAnalyticsAction = /\b(how much|total|sum|amount|spending|spendings|expense|expenses|spent|cost)\b/i.test(query);
    const hasTimePeriod = /\b(this month|this mnth|current month|last month|today|yesterday|this week|last week|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe)\b/i.test(query);
    
    if (isAnalyticsAction && hasTimePeriod) {
       const cleanQ = query.toLowerCase();
       let periodLabel = "this period";
       const now = new Date();
       
       if (/\btoday\b/.test(cleanQ)) periodLabel = "Today";
       else if (/\byesterday\b/.test(cleanQ)) periodLabel = "Yesterday";
       else if (/\b(this week)\b/.test(cleanQ)) periodLabel = "This Week";
       else if (/\b(this month|this mnth|current month)\b/.test(cleanQ)) periodLabel = "This Month";
       else if (/\b(last month)\b/.test(cleanQ)) periodLabel = "Last Month";
       else {
           const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
           let monthIdx = -1;
           let monthName = "";
           for (let i = 0; i < months.length; i++) {
               if (new RegExp(`\\b${months[i]}`).test(cleanQ) || (months[i]==='sep' && /\bspe\b/.test(cleanQ))) {
                   monthIdx = i;
                   monthName = months[i].charAt(0).toUpperCase() + months[i].slice(1);
                   break;
               }
           }
           if (monthIdx !== -1) periodLabel = monthName;
       }
       return periodLabel;
    }
    return null;
}

try {
  const c1 = testCopy("copy evrything from sep 4 to sep 7 except coffee and tea");
  assert.strictEqual(c1.mode, 'copy', 'Failed copy mode detection');
  assert.ok(c1.exclusions.includes('coffee'), 'Failed to extract exclusions');
  
  const c2 = testCopy("transfer yesterday to today");
  assert.strictEqual(c2.mode, 'transfer', 'Failed transfer mode');

  assert.strictEqual(testAnalytics("total spendings for sep"), 'Sep', 'Failed analytics sep');
  assert.strictEqual(testAnalytics("spending of this mnth"), 'This Month', 'Failed analytics this mnth');
  assert.strictEqual(testAnalytics("How much spent this month?"), 'This Month', 'Failed analytics this month');
  assert.strictEqual(testAnalytics("total spending in spe"), 'Sep', 'Failed analytics spe');

  console.log("✅ ALL GOALS PASSED!");
} catch (err) {
  console.error("❌ TEST FAILED:", err.message);
  process.exit(1);
}
