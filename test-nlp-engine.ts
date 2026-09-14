import { parseNlpQuery, NlpContext } from './src/utils/nlpEngine';

const runTests = () => {
  let passed = 0;
  let total = 0;

  const check = (name: string, q: string, ctx: NlpContext | undefined, expectedAction: string, expectedCat?: string, expectedDateLabel?: string) => {
    total++;
    const res = parseNlpQuery(q, ctx);
    const passAction = res.action === expectedAction;
    const passCat = expectedCat ? res.category === expectedCat : true;
    const passDate = expectedDateLabel ? res.dateRange?.label === expectedDateLabel : true;
    
    if (passAction && passCat && passDate) {
      passed++;
      console.log(`✅ PASS: ${name}`);
    } else {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Query: "${q}"`);
      console.log(`   Expected: Action=${expectedAction} Cat=${expectedCat} Date=${expectedDateLabel}`);
      console.log(`   Got:      Action=${res.action} Cat=${res.category} Date=${res.dateRange?.label}`);
    }
    return res; // Pass as context to next
  };

  console.log("--- PART 28: COMPLEX MULTI-ENTITY ---");
  check("Complex 1", "Which day did I spend the most on food this month?", undefined, "HIGHEST_DAY", "Dining", "This Month");
  check("Complex 2", "What is my highest shopping expense this week?", undefined, "HIGHEST_SINGLE", "Shopping", "This Week");
  check("Complex 3", "Average daily spending on petrol in august", undefined, "AVERAGE", "Transport", "August");

  console.log("\n--- PART 29: CONVERSATIONAL FOLLOW-UP ---");
  const ctx1 = check("Turn 1", "How much did I spend yesterday?", undefined, "TOTAL", undefined, "Yesterday");
  const ctx2 = check("Turn 2 (Follow up)", "What about food?", ctx1, "TOTAL", "Dining", "Yesterday");
  const ctx3 = check("Turn 3 (Follow up 2)", "And last month?", ctx2, "TOTAL", "Dining", "Last Month");

  console.log(`\nResults: ${passed} / ${total} passed`);
};

runTests();
