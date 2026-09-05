const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatDrawer.tsx', 'utf8');

const analyticsBlock = `
    // INTENT 6: Spending Analytics ("total spendings for sep", "How much spent this month?", "spending of this mnth")
    const isAnalyticsAction = /\\b(how much|total|sum|amount|spending|spendings|expense|expenses|spent|cost)\\b/i.test(query);
    const hasTimePeriod = /\\b(this month|this mnth|current month|last month|today|yesterday|this week|last week|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe)\\b/i.test(query);
    
    if (isAnalyticsAction && hasTimePeriod && !isDeleteIntent && !isBulkDateAction && !isAmountModifyAction && !isBulkCategoryShift) {
       const cleanQ = query.toLowerCase();
       let startDate = new Date();
       let endDate = new Date();
       let periodLabel = "this period";
       
       const now = new Date();
       
       if (/\\btoday\\b/.test(cleanQ)) {
           startDate.setHours(0,0,0,0);
           endDate.setHours(23,59,59,999);
           periodLabel = "Today";
       } else if (/\\byesterday\\b/.test(cleanQ)) {
           startDate.setDate(now.getDate() - 1);
           startDate.setHours(0,0,0,0);
           endDate = new Date(startDate);
           endDate.setHours(23,59,59,999);
           periodLabel = "Yesterday";
       } else if (/\\b(this week)\\b/.test(cleanQ)) {
           const day = now.getDay();
           const diff = now.getDate() - day + (day == 0 ? -6:1); // Monday start
           startDate = new Date(now.setDate(diff));
           startDate.setHours(0,0,0,0);
           endDate = new Date();
           periodLabel = "This Week";
       } else if (/\\b(this month|this mnth|current month)\\b/.test(cleanQ)) {
           startDate = new Date(now.getFullYear(), now.getMonth(), 1);
           endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
           periodLabel = "This Month";
       } else if (/\\b(last month)\\b/.test(cleanQ)) {
           startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
           endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
           periodLabel = "Last Month";
       } else {
           // Explicit month
           const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
           let monthIdx = -1;
           let monthName = "";
           for (let i = 0; i < months.length; i++) {
               if (new RegExp(\`\\\\b\${months[i]}\`).test(cleanQ) || (months[i]==='sep' && /\\bspe\\b/.test(cleanQ))) {
                   monthIdx = i;
                   monthName = months[i].charAt(0).toUpperCase() + months[i].slice(1);
                   break;
               }
           }
           if (monthIdx !== -1) {
               startDate = new Date(now.getFullYear(), monthIdx, 1);
               endDate = new Date(now.getFullYear(), monthIdx + 1, 0, 23, 59, 59);
               periodLabel = monthName;
           }
       }

       const filtered = validExpenses.filter(e => {
           if (!e.date) return false;
           const d = new Date(e.date);
           return d >= startDate && d <= endDate;
       });

       const total = filtered.reduce((sum, e) => sum + e.amount, 0);
       
       const aiMessage: ChatMessage = {
         id: (Date.now() + 1).toString(), sender: 'ai',
         text: \`📊 **Spending Analytics: \${periodLabel}**\\n\\nYou have spent a total of **₹\${total.toLocaleString('en-IN')}** during this period across \${filtered.length} transactions.\`,
         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
       };
       setMessages(prev => [...prev, aiMessage]);
       return;
    }

    try {
`;

// Replace `try {` with the analytics block (which sits right before the Gemini fallback)
code = code.replace("    try {\n      const historyForApi", analyticsBlock + "      const historyForApi");
fs.writeFileSync('src/components/AIChatDrawer.tsx', code);
