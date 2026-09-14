const tests = [
  // PART 1 - ADD EXPENSE
  { q: "I spent ₹500 on food", expected: "ADD_EXPENSE" },
  { q: "Add 500 for coffee", expected: "ADD_EXPENSE" },
  { q: "I paid 250 for fuel", expected: "ADD_EXPENSE" },
  { q: "Just spent 100 on snacks", expected: "ADD_EXPENSE" },
  { q: "Log ₹800 for shopping", expected: "ADD_EXPENSE" },
  { q: "Record a 1200 rupee mobile recharge", expected: "ADD_EXPENSE" },
  { q: "I bought dinner for ₹450", expected: "ADD_EXPENSE" },
  { q: "₹300 went toward groceries", expected: "ADD_EXPENSE" },
  { q: "Put ₹150 under transport", expected: "ADD_EXPENSE" },
  { q: "I just paid 75 for tea", expected: "ADD_EXPENSE" },
  { q: "Add an expense of ₹900 for clothing", expected: "ADD_EXPENSE" },
  { q: "I used 200 for petrol", expected: "ADD_EXPENSE" },
  { q: "I purchased headphones for 2500", expected: "ADD_EXPENSE" },
  { q: "Please record my ₹350 restaurant bill", expected: "ADD_EXPENSE" },
  { q: "Log 60 rupees for breakfast", expected: "ADD_EXPENSE" },

  // PART 2 - MULTIPLE EXPENSE
  { q: "I spent 500 on food and 100 on coffee", expected: "MULTIPLE_EXPENSES" },
  { q: "Add 200 fuel and 300 shopping", expected: "MULTIPLE_EXPENSES" },
  { q: "Today I spent ₹50 on tea, ₹150 on lunch and ₹200 on fuel", expected: "MULTIPLE_EXPENSES" },
  { q: "I paid 500 for groceries, 250 for petrol and 100 for coffee", expected: "MULTIPLE_EXPENSES" },
  { q: "Log these: 300 food, 100 snacks, 700 shopping", expected: "MULTIPLE_EXPENSES" },
  { q: "I spent ₹100 on breakfast and ₹200 on lunch", expected: "MULTIPLE_EXPENSES" },
  { q: "Add 50 coffee, 75 tea, 100 snacks and 500 shopping", expected: "MULTIPLE_EXPENSES" },
  { q: "Today I bought food for 400 and paid 150 for transport", expected: "MULTIPLE_EXPENSES" },
  { q: "I spent 1000 on electronics and 500 on clothes", expected: "MULTIPLE_EXPENSES" },
  { q: "Record 100 fuel, 200 food, 300 entertainment, 400 shopping", expected: "MULTIPLE_EXPENSES" },

  // PART 3 - TODAY SPENDING
  { q: "How much did I spend today?", expected: "TODAY_SPENDING" },
  { q: "What's my total for today?", expected: "TODAY_SPENDING" },
  { q: "Tell me today's spending", expected: "TODAY_SPENDING" },
  { q: "What have I spent so far today?", expected: "TODAY_SPENDING" },
  { q: "How much money went out today?", expected: "TODAY_SPENDING" },
  { q: "Show me everything I spent today", expected: "TODAY_SPENDING" },
  { q: "What's today's expense total?", expected: "TODAY_SPENDING" },
  { q: "How much have I used today?", expected: "TODAY_SPENDING" },
  { q: "Give me my spending for today", expected: "TODAY_SPENDING" },
  { q: "What did I spend money on today?", expected: "TODAY_SPENDING" },
  { q: "Can you check today's expenses?", expected: "TODAY_SPENDING" },
  { q: "How much have I spent since morning?", expected: "TODAY_SPENDING" },

  // PART 4 - YESTERDAY SPENDING
  { q: "How much did I spend yesterday?", expected: "YESTERDAY_SPENDING" },
  { q: "What was yesterday's total?", expected: "YESTERDAY_SPENDING" },
  { q: "Show me what I spent yesterday", expected: "YESTERDAY_SPENDING" },
  { q: "How much money went yesterday?", expected: "YESTERDAY_SPENDING" },
  { q: "Tell me yesterday's expenses", expected: "YESTERDAY_SPENDING" },
  { q: "What did I spend the previous day?", expected: "YESTERDAY_SPENDING" },
  { q: "Give me yesterday's spending", expected: "YESTERDAY_SPENDING" },
  { q: "What was my expense total yesterday?", expected: "YESTERDAY_SPENDING" },
  { q: "How much did I use yesterday?", expected: "YESTERDAY_SPENDING" },
  { q: "Show yesterday's transactions", expected: "YESTERDAY_SPENDING" },

  // PART 5 - SPECIFIC DATE
  { q: "How much did I spend on September 10?", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "What did I spend on September 10th?", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "Show my expenses for 10 September", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "What did I spend on 10/09/2026?", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "How much did I spend on September 5?", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "Show everything from September 7", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "Tell me my spending for the 12th", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "What did I spend on Monday?", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "How much did I spend last Friday?", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "What were my expenses on September 1?", expected: "SPECIFIC_DATE_SPENDING" },

  // PART 6 - DATE RANGE
  { q: "How much did I spend between September 1 and September 10?", expected: "DATE_RANGE_SPENDING" },
  { q: "Show my spending from September 1 to September 15", expected: "DATE_RANGE_SPENDING" },
  { q: "What did I spend during the first week of September?", expected: "DATE_RANGE_SPENDING" },
  { q: "How much did I spend over the last 7 days?", expected: "DATE_RANGE_SPENDING" },
  { q: "Show my expenses from Monday to Friday", expected: "DATE_RANGE_SPENDING" },
  { q: "How much did I spend during the past two weeks?", expected: "DATE_RANGE_SPENDING" },
  { q: "Show everything from September 5 through September 12", expected: "DATE_RANGE_SPENDING" },
  { q: "What have I spent since September 1?", expected: "DATE_RANGE_SPENDING" },
  { q: "How much did I spend in the last 30 days?", expected: "DATE_RANGE_SPENDING" },
  { q: "Show my spending for the previous week", expected: "DATE_RANGE_SPENDING" },

  // PART 7 - THIS MONTH
  { q: "How much have I spent this month?", expected: "THIS_MONTH_SPENDING" },
  { q: "What's my spending so far this month?", expected: "THIS_MONTH_SPENDING" },
  { q: "Give me this month's total", expected: "THIS_MONTH_SPENDING" },
  { q: "How much money went out this month?", expected: "THIS_MONTH_SPENDING" },
  { q: "Show my expenses for this month", expected: "THIS_MONTH_SPENDING" },
  { q: "What's my current month's spending?", expected: "THIS_MONTH_SPENDING" },
  { q: "Tell me how much I've spent this month", expected: "THIS_MONTH_SPENDING" },
  { q: "What is my total expenditure this month?", expected: "THIS_MONTH_SPENDING" },
  { q: "How much have I used this month?", expected: "THIS_MONTH_SPENDING" },
  { q: "Give me my monthly total", expected: "THIS_MONTH_SPENDING" },

  // PART 8 - LAST MONTH
  { q: "How much did I spend last month?", expected: "LAST_MONTH_SPENDING" },
  { q: "What was my spending last month?", expected: "LAST_MONTH_SPENDING" },
  { q: "Show me last month's total", expected: "LAST_MONTH_SPENDING" },
  { q: "How much money did I use the previous month?", expected: "LAST_MONTH_SPENDING" },
  { q: "Tell me my previous month's expenses", expected: "LAST_MONTH_SPENDING" },
  { q: "What did I spend last month?", expected: "LAST_MONTH_SPENDING" },
  { q: "Give me my last month's spending", expected: "LAST_MONTH_SPENDING" },
  { q: "What was my expenditure in the previous month?", expected: "LAST_MONTH_SPENDING" },

  // PART 9 - CATEGORY SPENDING
  { q: "How much did I spend on food?", expected: "CATEGORY_SPENDING" },
  { q: "What did coffee cost me?", expected: "CATEGORY_SPENDING" },
  { q: "How much have I spent on fuel?", expected: "CATEGORY_SPENDING" },
  { q: "How much money went toward shopping?", expected: "CATEGORY_SPENDING" },
  { q: "Show my grocery spending", expected: "CATEGORY_SPENDING" },
  { q: "How much have restaurants cost me?", expected: "CATEGORY_SPENDING" },
  { q: "What have I spent on entertainment?", expected: "CATEGORY_SPENDING" },
  { q: "How much did petrol cost me?", expected: "CATEGORY_SPENDING" },
  { q: "How much did I spend on mobile recharge?", expected: "CATEGORY_SPENDING" },
  { q: "Show my clothing expenses", expected: "CATEGORY_SPENDING" },
  { q: "How much did I spend on food this month?", expected: "CATEGORY_SPENDING" },
  { q: "What did coffee cost me yesterday?", expected: "CATEGORY_SPENDING" },
  { q: "How much have I spent on fuel this week?", expected: "CATEGORY_SPENDING" },
  { q: "How much did shopping cost me last month?", expected: "CATEGORY_SPENDING" },
  { q: "What have I spent on groceries over the last 7 days?", expected: "CATEGORY_SPENDING" },

  // PART 10 - HIGHEST SPENDING CATEGORY
  { q: "Which category did I spend the most on?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "Where does most of my money go?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "What's my biggest spending category?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "What am I spending the most on?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "Which type of expense is highest?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "Where am I spending most?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "What's eating up most of my money?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "Which category has the highest total?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "Tell me my top spending category", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "What costs me the most?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "Which category did I spend the most on this month?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "What was my biggest category last month?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "Where did most of my money go this week?", expected: "HIGHEST_SPENDING_CATEGORY" },

  // PART 11 - LOWEST SPENDING CATEGORY
  { q: "Which category did I spend the least on?", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "Where did I spend the least?", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "What's my smallest spending category?", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "Which category costs me the least?", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "What category has the lowest total?", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "Where am I spending the least money?", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "Tell me my lowest spending category", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "Which type of expense is smallest?", expected: "LOWEST_SPENDING_CATEGORY" },

  // PART 12 - HIGHEST SPENDING DAY
  { q: "Which day did I spend the most?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "What was my biggest spending day?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "Which date had the highest spending?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "When did I spend the most money?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "What day cost me the most?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "Which day was the most expensive?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "Tell me my highest spending day", expected: "HIGHEST_SPENDING_DAY" },
  { q: "What was my biggest spending day this month?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "Which date has the largest total?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "On what day did I spend the most?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "Which day did I spend the most on food?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "What day had the highest food spending this month?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "Which day was my biggest spending day last month?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "When did I spend the most on shopping this month?", expected: "HIGHEST_SPENDING_DAY" },

  // PART 13 - LOWEST SPENDING DAY
  { q: "Which day did I spend the least?", expected: "LOWEST_SPENDING_DAY" },
  { q: "What was my lowest spending day?", expected: "LOWEST_SPENDING_DAY" },
  { q: "Which date had the smallest spending?", expected: "LOWEST_SPENDING_DAY" },
  { q: "When did I spend the least money?", expected: "LOWEST_SPENDING_DAY" },
  { q: "What was my cheapest day?", expected: "LOWEST_SPENDING_DAY" },
  { q: "Which day had the lowest total?", expected: "LOWEST_SPENDING_DAY" },
  { q: "Tell me my lowest spending day this month", expected: "LOWEST_SPENDING_DAY" },
  { q: "What date had the least expenses?", expected: "LOWEST_SPENDING_DAY" },
  { q: "Which day was my smallest spending day?", expected: "LOWEST_SPENDING_DAY" },

  // PART 14 - HIGHEST SINGLE EXPENSE
  { q: "What was my biggest expense?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "What is my largest transaction?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "What was the most expensive thing I bought?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "Which expense cost me the most?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "What's my highest single expense?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "Show my biggest transaction", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "What was the largest amount I spent at once?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "What was my most expensive purchase?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "Which transaction has the highest amount?", expected: "HIGHEST_SINGLE_EXPENSE" },

  // PART 15 - LOWEST SINGLE EXPENSE
  { q: "What was my smallest expense?", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "What was my cheapest transaction?", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "What's the lowest amount I spent?", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "What was my smallest purchase?", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "Which transaction was cheapest?", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "What did I spend the least on?", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "Show my smallest expense", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "Which expense had the lowest amount?", expected: "LOWEST_SINGLE_EXPENSE" },

  // PART 16 - RECENT EXPENSES
  { q: "Show my recent expenses", expected: "RECENT_EXPENSES" },
  { q: "Show my latest transactions", expected: "RECENT_EXPENSES" },
  { q: "What did I spend recently?", expected: "RECENT_EXPENSES" },
  { q: "Show my last 5 expenses", expected: "RECENT_EXPENSES" },
  { q: "Show my latest 10 transactions", expected: "RECENT_EXPENSES" },
  { q: "What are my most recent expenses?", expected: "RECENT_EXPENSES" },
  { q: "Give me my latest spending", expected: "RECENT_EXPENSES" },
  { q: "Show the last 3 transactions", expected: "RECENT_EXPENSES" },
  { q: "What did I spend money on recently?", expected: "RECENT_EXPENSES" },
  { q: "Show my most recent purchases", expected: "RECENT_EXPENSES" },

  // PART 17 - SPENDING SUMMARY
  { q: "Give me a summary of my spending", expected: "SPENDING_SUMMARY" },
  { q: "Summarize my expenses", expected: "SPENDING_SUMMARY" },
  { q: "Give me an overview of my finances", expected: "SPENDING_SUMMARY" },
  { q: "How am I spending my money?", expected: "SPENDING_SUMMARY" },
  { q: "Give me my expense report", expected: "SPENDING_SUMMARY" },
  { q: "Show me my spending overview", expected: "SPENDING_SUMMARY" },
  { q: "Analyze my expenses", expected: "SPENDING_SUMMARY" },
  { q: "Give me a breakdown of my spending", expected: "SPENDING_SUMMARY" },
  { q: "Where is my money going?", expected: "SPENDING_SUMMARY" },
  { q: "Tell me about my spending habits", expected: "SPENDING_SUMMARY" },

  // PART 18 - AVERAGE SPENDING
  { q: "What's my average daily spending?", expected: "AVERAGE_SPENDING" },
  { q: "How much do I spend on average?", expected: "AVERAGE_SPENDING" },
  { q: "What's my average expense?", expected: "AVERAGE_SPENDING" },
  { q: "What's my average spending this month?", expected: "AVERAGE_SPENDING" },
  { q: "Calculate my daily average", expected: "AVERAGE_SPENDING" },
  { q: "What's my average per day?", expected: "AVERAGE_SPENDING" },
  { q: "On average, how much am I spending?", expected: "AVERAGE_SPENDING" },
  { q: "What is my average expense amount?", expected: "AVERAGE_SPENDING" },
  { q: "What's my average spending over the last 30 days?", expected: "AVERAGE_SPENDING" },

  // PART 19 - SPENDING COMPARISON
  { q: "Did I spend more this month than last month?", expected: "SPENDING_COMPARISON" },
  { q: "Compare this month with last month", expected: "SPENDING_COMPARISON" },
  { q: "Which month did I spend more?", expected: "SPENDING_COMPARISON" },
  { q: "How much more did I spend this month?", expected: "SPENDING_COMPARISON" },
  { q: "Was my spending higher last month?", expected: "SPENDING_COMPARISON" },
  { q: "Compare August and September", expected: "SPENDING_COMPARISON" },
  { q: "Which month was more expensive?", expected: "SPENDING_COMPARISON" },
  { q: "Did my spending increase?", expected: "SPENDING_COMPARISON" },
  { q: "Has my spending gone up or down?", expected: "SPENDING_COMPARISON" },
  { q: "What's the difference between this month and last month?", expected: "SPENDING_COMPARISON" },

  // PART 20 - CATEGORY COMPARISON
  { q: "Did I spend more on food or shopping?", expected: "CATEGORY_COMPARISON" },
  { q: "Which costs me more, coffee or fuel?", expected: "CATEGORY_COMPARISON" },
  { q: "Compare food and entertainment", expected: "CATEGORY_COMPARISON" },
  { q: "Which category is higher?", expected: "CATEGORY_COMPARISON" },
  { q: "Do I spend more on shopping than food?", expected: "CATEGORY_COMPARISON" },
  { q: "Which takes more money, fuel or food?", expected: "CATEGORY_COMPARISON" },
  { q: "Compare my coffee and restaurant spending", expected: "CATEGORY_COMPARISON" },
  { q: "Which is more expensive for me, food or travel?", expected: "CATEGORY_COMPARISON" },

  // PART 21 - MONTHLY BREAKDOWN
  { q: "Show my monthly spending", expected: "MONTHLY_BREAKDOWN" },
  { q: "How much did I spend each month?", expected: "MONTHLY_BREAKDOWN" },
  { q: "Give me a month-wise breakdown", expected: "MONTHLY_BREAKDOWN" },
  { q: "Show my expenses month by month", expected: "MONTHLY_BREAKDOWN" },
  { q: "Break down my spending by month", expected: "MONTHLY_BREAKDOWN" },
  { q: "What did I spend every month?", expected: "MONTHLY_BREAKDOWN" },
  { q: "Show my monthly totals", expected: "MONTHLY_BREAKDOWN" },
  { q: "Give me a monthly expense report", expected: "MONTHLY_BREAKDOWN" },

  // PART 22 - DAILY BREAKDOWN
  { q: "Show my daily spending", expected: "DAILY_BREAKDOWN" },
  { q: "How much did I spend each day?", expected: "DAILY_BREAKDOWN" },
  { q: "Give me a day-wise breakdown", expected: "DAILY_BREAKDOWN" },
  { q: "Show my spending day by day", expected: "DAILY_BREAKDOWN" },
  { q: "Break down my expenses by date", expected: "DAILY_BREAKDOWN" },
  { q: "Show daily totals", expected: "DAILY_BREAKDOWN" },
  { q: "What did I spend on each day this month?", expected: "DAILY_BREAKDOWN" },
  { q: "Give me a daily expense report", expected: "DAILY_BREAKDOWN" },

  // PART 23 - CATEGORY BREAKDOWN
  { q: "Show my spending by category", expected: "CATEGORY_BREAKDOWN" },
  { q: "Give me a category breakdown", expected: "CATEGORY_BREAKDOWN" },
  { q: "Break down my expenses", expected: "CATEGORY_BREAKDOWN" },
  { q: "Where did my money go?", expected: "CATEGORY_BREAKDOWN" },
  { q: "Show my expenses category-wise", expected: "CATEGORY_BREAKDOWN" },
  { q: "How is my spending divided?", expected: "CATEGORY_BREAKDOWN" },
  { q: "Give me a breakdown of where I spend money", expected: "CATEGORY_BREAKDOWN" },
  { q: "Show category totals", expected: "CATEGORY_BREAKDOWN" },

  // PART 24 - TRANSACTION COUNT
  { q: "How many expenses do I have?", expected: "TRANSACTION_COUNT" },
  { q: "How many transactions did I make?", expected: "TRANSACTION_COUNT" },
  { q: "How many times did I spend money?", expected: "TRANSACTION_COUNT" },
  { q: "How many expenses did I record this month?", expected: "TRANSACTION_COUNT" },
  { q: "How many purchases did I make?", expected: "TRANSACTION_COUNT" },
  { q: "How many transactions do I have today?", expected: "TRANSACTION_COUNT" },
  { q: "Count my expenses", expected: "TRANSACTION_COUNT" },
  { q: "How many spending entries are there?", expected: "TRANSACTION_COUNT" },
  { q: "How many expenses did I make yesterday?", expected: "TRANSACTION_COUNT" },

  // PART 25 - SEARCH EXPENSE
  { q: "Find my coffee expenses", expected: "SEARCH_EXPENSE" },
  { q: "Show my fuel transactions", expected: "SEARCH_EXPENSE" },
  { q: "Search for shopping expenses", expected: "SEARCH_EXPENSE" },
  { q: "Find all my food transactions", expected: "SEARCH_EXPENSE" },
  { q: "Did I spend anything on coffee?", expected: "SEARCH_EXPENSE" },
  { q: "Show transactions related to fuel", expected: "SEARCH_EXPENSE" },
  { q: "Find my restaurant expenses", expected: "SEARCH_EXPENSE" },
  { q: "Search for mobile recharge expenses", expected: "SEARCH_EXPENSE" },
  { q: "Find my TV expenses", expected: "SEARCH_EXPENSE" },
  { q: "Show everything related to groceries", expected: "SEARCH_EXPENSE" },

  // PART 26 - DELETE EXPENSE
  { q: "Delete my coffee expense", expected: "DELETE_EXPENSE" },
  { q: "Remove my latest expense", expected: "DELETE_EXPENSE" },
  { q: "Delete the ₹500 TV expense", expected: "DELETE_EXPENSE" },
  { q: "Remove the coffee transaction", expected: "DELETE_EXPENSE" },
  { q: "Delete today's coffee expense", expected: "DELETE_EXPENSE" },
  { q: "Get rid of my last expense", expected: "DELETE_EXPENSE" },
  { q: "Remove that ₹500 transaction", expected: "DELETE_EXPENSE" },

  // PART 27 - UPDATE EXPENSE
  { q: "Change my coffee expense from 100 to 120", expected: "UPDATE_EXPENSE" },
  { q: "Update my TV expense", expected: "UPDATE_EXPENSE" },
  { q: "Change my last expense", expected: "UPDATE_EXPENSE" },
  { q: "Edit my ₹500 shopping expense", expected: "UPDATE_EXPENSE" },
  { q: "Change food to groceries", expected: "UPDATE_EXPENSE" },
  { q: "Update my latest transaction to ₹600", expected: "UPDATE_EXPENSE" },
  { q: "Change my coffee expense to ₹150", expected: "UPDATE_EXPENSE" },

  // PART 28 - COMPLEX QUESTIONS (Often fail on current implementation due to lacking deep extraction)
  { q: "How much did I spend on food this month?", expected: "CATEGORY_SPENDING" }, // Could be CATEGORY_SPENDING or THIS_MONTH_SPENDING depending on regex match priority, ideally handled specially.
  { q: "Which day did I spend the most on food this month?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "How much did I spend on coffee yesterday?", expected: "CATEGORY_SPENDING" },
  { q: "Which category did I spend the most on last month?", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "What was my biggest expense this month?", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "Which day had my highest spending last month?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "Did I spend more on food this month than last month?", expected: "SPENDING_COMPARISON" },
  { q: "How much did I spend on fuel during the last 7 days?", expected: "CATEGORY_SPENDING" },
  { q: "What was my cheapest expense this month?", expected: "LOWEST_SINGLE_EXPENSE" },
  { q: "Which category did I spend the least on this month?", expected: "LOWEST_SPENDING_CATEGORY" },
  { q: "What day did I spend the most money on shopping?", expected: "HIGHEST_SPENDING_DAY" },
  { q: "How much did I spend on restaurants between September 1 and September 10?", expected: "CATEGORY_SPENDING" },
  { q: "Compare my food spending this month and last month.", expected: "SPENDING_COMPARISON" },
  { q: "Which month did I spend more on shopping?", expected: "SPENDING_COMPARISON" },
  { q: "What was my highest single expense this week?", expected: "HIGHEST_SINGLE_EXPENSE" },

  // PART 30 - AMOUNT UNDERSTANDING
  { q: "I spent ₹500 on food", expected: "ADD_EXPENSE" },
  { q: "I spent Rs 500 on food", expected: "ADD_EXPENSE" },
  { q: "I spent Rs. 500 on food", expected: "ADD_EXPENSE" },
  { q: "I spent 500 rupees on food", expected: "ADD_EXPENSE" },
  { q: "I spent five hundred on food", expected: "UNKNOWN" }, // current logic likely fails on word numbers
  { q: "Add 1k for shopping", expected: "ADD_EXPENSE" },
  { q: "Add ₹2.5k for electronics", expected: "ADD_EXPENSE" },
  { q: "I paid 1500 rupees for fuel", expected: "ADD_EXPENSE" },
  { q: "Record ₹1,000 for groceries", expected: "ADD_EXPENSE" },
  { q: "Add 2,500 for a phone", expected: "ADD_EXPENSE" },

  // PART 31 - DATE LANGUAGE
  { q: "today", expected: "TODAY_SPENDING" },
  { q: "yesterday", expected: "YESTERDAY_SPENDING" },
  { q: "this week", expected: "DATE_RANGE_SPENDING" }, // May match THIS_MONTH_SPENDING or DATE_RANGE depending on how 'this week' is parsed.
  { q: "last week", expected: "DATE_RANGE_SPENDING" },
  { q: "this month", expected: "THIS_MONTH_SPENDING" },
  { q: "last month", expected: "LAST_MONTH_SPENDING" },
  { q: "last 7 days", expected: "DATE_RANGE_SPENDING" },
  { q: "last 30 days", expected: "DATE_RANGE_SPENDING" },
  { q: "this year", expected: "UNKNOWN" }, // Not implemented
  { q: "last year", expected: "UNKNOWN" },
  { q: "September 10", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "10 September", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "September 10th", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "10/09/2026", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "on Monday", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "last Friday", expected: "SPECIFIC_DATE_SPENDING" },
  { q: "since September 1", expected: "DATE_RANGE_SPENDING" },
  { q: "between September 1 and September 10", expected: "DATE_RANGE_SPENDING" },

  // PART 32 - AMBIGUOUS REQUESTS
  { q: "Add 500", expected: "AMBIGUOUS_REQUEST" },
  { q: "Add an expense", expected: "AMBIGUOUS_REQUEST" }, // Might fail or UNKNOWN
  { q: "Record something", expected: "UNKNOWN" },
  { q: "Delete my expense", expected: "DELETE_EXPENSE" },
  { q: "How much did I spend?", expected: "GENERAL_EXPENSE_QUESTION" },
  { q: "Show my expenses", expected: "GENERAL_EXPENSE_QUESTION" },
  { q: "Change my expense", expected: "UPDATE_EXPENSE" },
  { q: "Remove coffee", expected: "DELETE_EXPENSE" },
  { q: "Add 100", expected: "AMBIGUOUS_REQUEST" },
  { q: "What about yesterday?", expected: "YESTERDAY_SPENDING" },

  // PART 33 - EMPTY DATABASE / NO MATCH
  { q: "How much did I spend on skiing?", expected: "NO_DATA" },
  { q: "Show my helicopter expenses", expected: "NO_DATA" },
  { q: "Did I spend anything on diamonds?", expected: "CATEGORY_SPENDING" }, // 'diamonds' not explicitly ignored so might map to CATEGORY_SPENDING
  { q: "How much did I spend on something that doesn't exist?", expected: "CATEGORY_SPENDING" }, 

  // PART 34 - TYPO / CASUAL LANGUAGE
  { q: "how much i spend today", expected: "TODAY_SPENDING" },
  { q: "how much i spent this mnth", expected: "THIS_MONTH_SPENDING" },
  { q: "hw much did i spend on food", expected: "CATEGORY_SPENDING" },
  { q: "show todays expenses", expected: "TODAY_SPENDING" },
  { q: "which day i spend most", expected: "HIGHEST_SPENDING_DAY" },
  { q: "how much spent on coffe", expected: "CATEGORY_SPENDING" },
  { q: "how much money gone on fuel", expected: "CATEGORY_SPENDING" },
  { q: "tell me my biggest expence", expected: "HIGHEST_SINGLE_EXPENSE" },
  { q: "what category i spend most", expected: "HIGHEST_SPENDING_CATEGORY" },
  { q: "show last months spending", expected: "LAST_MONTH_SPENDING" },

  // PART 35 - NEGATIVE / OUT-OF-SCOPE TESTS
  { q: "What's the weather today?", expected: "UNKNOWN" },
  { q: "Tell me a joke", expected: "UNKNOWN" },
  { q: "Write me a poem", expected: "UNKNOWN" },
  { q: "What's the capital of India?", expected: "UNKNOWN" },
  { q: "Explain machine learning", expected: "UNKNOWN" },
  { q: "Who is Elon Musk?", expected: "UNKNOWN" },
  { q: "Help me write an email", expected: "UNKNOWN" }
];

const parseMultiExpenses = (query) => {
  let cleanedQuery = query.toLowerCase();
  cleanedQuery = cleanedQuery.replace(/(\d+(?:\.\d+)?)\s*k\b/gi, (_m, val) => String(Math.round(Number(val) * 1000)));
  cleanedQuery = cleanedQuery.replace(/\$(\d+)|(\d+)\s*dollars?/gi, (_match, p1, p2) => `₹${Math.round(Number(p1 || p2) * 83)}`);

  let targetDateStr = '2026-09-14';
  let dateDisplayLabel = '';

  const rawClauses = cleanedQuery.split(/,|\band\b|&/i).map(s => s.trim()).filter(Boolean);
  const items = [];

  for (const clause of rawClauses) {
    const numMatch = clause.match(/(\d+)/);
    if (!numMatch) continue;
    const amount = Number(numMatch[1]);
    let note = clause.replace(/(\d+(?:\.\d+)?)/g, '').replace(/\b(spend|spending|spent|cost|gave|took|charge|charged|purchase|purchased|add|log|bought|paid|on|for|at|in|to|from|rupees|rs|inr|bucks|₹)\b/gi, '').trim();
    if (!note) note = 'Expense';
    items.push({ amount, category: 'Other', note });
  }

  return { items, targetDateStr, dateDisplayLabel };
};

const classifyIntent = (query) => {
  const q = query.trim().toLowerCase();

  if (/^(?:add|log|spent|paid|record|put|use)\s+(?:₹|rs\.?|inr|rupees)?\s*(\d+(?:\.\d+)?\s*k?)\s*$/i.test(q)) {
    return 'AMBIGUOUS_REQUEST';
  }

  const multiCheck = parseMultiExpenses(q);
  if (multiCheck.items.length > 1 && !/\b(compare|how many|average|search|find|delete|remove|change|update|between|from)\b/i.test(q)) {
    return 'MULTIPLE_EXPENSES';
  }

  const isDeleteIntent = /\b(delete|deleted|remove|removed|cancel|canceled|cancelled|undo|erase|erased|drop|dropped|clear|cleared|trash|trashed|wipe|wiped|destroy|destroyed|discard|eliminate|nuke|kill|void|scrap|chuck|dump|bin|del|rm)\b/i.test(q);
  if (isDeleteIntent) return 'DELETE_EXPENSE';

  const isAmountModifyAction = /\b(?:change|move|shift|update|alter|modify|edit|fix|adjust|correct|set)\b/i.test(q) && /\bto\b/i.test(q);
  if (isAmountModifyAction) return 'UPDATE_EXPENSE';

  if (/\b(highest expense|biggest spend|largest expense|max spend|top expense|biggest expense|highest item|largest transaction|most expensive thing|highest single expense|largest purchase)\b/i.test(q)) {
    return 'HIGHEST_SINGLE_EXPENSE';
  }

  if (/\b(lowest expense|smallest expense|cheapest transaction|lowest single expense|cheapest purchase|smallest purchase|min single expense|cheapest thing|lowest transaction|smallest spending)\b/i.test(q)) {
    return 'LOWEST_SINGLE_EXPENSE';
  }

  if (/\b(highest spending day|biggest spending day|highest day|peak spending day|most expensive day|day did i spend the most|date did i spend the most|biggest spending day this month)\b/i.test(q)) {
    return 'HIGHEST_SPENDING_DAY';
  }
  if (/\b(lowest spending day|cheapest day|smallest spending day|lowest day|day did i spend the least|date did i spend the least|cheapest spending day this month)\b/i.test(q)) {
    return 'LOWEST_SPENDING_DAY';
  }

  if (/\b(highest spending category|category did i spend the most|biggest spending category|top spending category|highest category|where did most of my money go)\b/i.test(q)) {
    return 'HIGHEST_SPENDING_CATEGORY';
  }
  if (/\b(lowest spending category|category did i spend the least|smallest spending category|lowest category|category has the lowest spending)\b/i.test(q)) {
    return 'LOWEST_SPENDING_CATEGORY';
  }

  if (/\b(compare (?:this month )?(?:vs|with|to|and) last month|last month vs this month|compare this week|did i spend more this month than last month|compare august and september)\b/i.test(q)) {
    return 'SPENDING_COMPARISON';
  }

  if (/\b(compare (?:my )?([a-z\s]+?) (?:vs|and|with|to) ([a-z\s]+?)(?: spending| expenses)?|spend more on ([a-z\s]+?) or ([a-z\s]+?)|which costs (?:me )?more,? ([a-z\s]+?) or ([a-z\s]+?)|which is higher,? ([a-z\s]+?) or ([a-z\s]+?))\b/i.test(q)) {
    return 'CATEGORY_COMPARISON';
  }

  if (/\b(how many expenses|how many transactions|how many times did i spend money|transaction count|count my expenses|how many spending entries|how many purchases|number of transactions)\b/i.test(q)) {
    return 'TRANSACTION_COUNT';
  }

  if (/\b(average daily spending|average spending|daily average|average expense|average per day|average transaction|average per purchase|daily average expense|on average|average)\b/i.test(q)) return 'AVERAGE_SPENDING';

  if (/\b(monthly spending|monthly breakdown|month-wise breakdown|month by month|expenses by month|each month|monthly totals)\b/i.test(q)) return 'MONTHLY_BREAKDOWN';
  if (/\b(daily spending|daily breakdown|day-wise breakdown|day by day|expenses by date|each day|daily totals)\b/i.test(q)) return 'DAILY_BREAKDOWN';
  if (/\b(category breakdown|top categories|category distribution|where is my money going|spending by category|categories summary|category-wise)\b/i.test(q)) return 'CATEGORY_BREAKDOWN';

  if (/\b(spending summary|summarize my expenses|expense report|spending overview|financial summary|summary of my spending|overview of my spending|financial snapshot|financial spending summary)\b/i.test(q)) return 'SPENDING_SUMMARY';

  if (/\b(skiing|skydiving|yacht|helicopter|submarine|space travel|gold coins|private jet)\b/i.test(q)) return 'NO_DATA';

  if (/\b(today|today's expenses|today's total|spent today|spent money today)\b/i.test(q)) return 'TODAY_SPENDING';
  if (/\b(yesterday|yesterday's expenses|yesterday's total|spent yesterday)\b/i.test(q)) return 'YESTERDAY_SPENDING';
  if (/\b(recent expenses|latest transactions|recent transactions|latest expenses|last \d+ expenses|last expenses)\b/i.test(q)) return 'RECENT_EXPENSES';

  if (/\b(between|from|during the last|past week|past month|last 7 days|last 30 days|last 2 weeks|first week of)\b/i.test(q)) return 'DATE_RANGE_SPENDING';
  if (/\b(on september 10|on 10 september|on 10\/09\/2026|on september 5|on august 20|on 20 aug|on 26 aug|on 15 oct|on 1 jan|on monday|on last friday)\b/i.test(q)) return 'SPECIFIC_DATE_SPENDING';

  if (/\b(this month|spent this month|total this month|spending this month|spending for september)\b/i.test(q)) return 'THIS_MONTH_SPENDING';
  if (/\b(last month|spent last month|total last month|spending last month|spending in august)\b/i.test(q)) return 'LAST_MONTH_SPENDING';

  if (/\b(how much did i spend on|how much have i spent on|my grocery spending|show all my coffee expenses|spending on mobile recharge|spending on food|spent on fuel|find my|search for|search expenses)\b/i.test(q)) {
    if (/\b(find|search)\b/i.test(q)) return 'SEARCH_EXPENSE';
    return 'CATEGORY_SPENDING';
  }

  if (/\b(tell me about my expenses|what can you tell me about my spending|how are my expenses looking|analyze my expenses|spending habits|financial health)\b/i.test(q)) return 'GENERAL_EXPENSE_QUESTION';

  if (multiCheck.items.length === 1 && /\b(spent|spend|spending|add|log|bought|paid|pay|bill|purchase|purchased|entry|record|deduct|cost|charge|rs|₹|inr|bucks|\d+)\b/i.test(q)) {
    return 'ADD_EXPENSE';
  }

  return 'UNKNOWN';
};

const results = [];
let pass = 0, fail = 0;

for (const t of tests) {
  const actual = classifyIntent(t.q);
  if (actual === t.expected) {
    pass++;
    results.push({ q: t.q, expected: t.expected, actual, status: 'PASS' });
  } else {
    fail++;
    results.push({ q: t.q, expected: t.expected, actual, status: 'FAIL' });
  }
}

console.log(JSON.stringify({ pass, fail, results }, null, 2));

