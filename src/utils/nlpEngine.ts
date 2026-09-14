export interface DateRange {
  start: string;
  end: string;
  label: string;
}

export interface NlpContext {
  action?: 'TOTAL' | 'AVERAGE' | 'HIGHEST_DAY' | 'LOWEST_DAY' | 'HIGHEST_CATEGORY' | 'LOWEST_CATEGORY' | 'HIGHEST_SINGLE' | 'LOWEST_SINGLE' | 'COUNT' | 'SEARCH' | 'COMPARE_SPENDING' | 'COMPARE_CATEGORY';
  category?: string;
  category2?: string;
  dateRange?: DateRange;
  originalQuery?: string;
}

export const extractDateRange = (query: string): DateRange | undefined => {
  const q = query.toLowerCase();
  const now = new Date();
  
  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  if (/\b(?:today)\b/.test(q)) {
    return { start: formatDate(now), end: formatDate(now), label: "Today" };
  }
  if (/\b(?:yesterday)\b/.test(q)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return { start: formatDate(d), end: formatDate(d), label: "Yesterday" };
  }
  if (/\b(?:this week)\b/.test(q)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { start: formatDate(d), end: formatDate(now), label: "This Week" };
  }
  if (/\b(?:last week|past week)\b/.test(q)) {
    const start = new Date(now);
    start.setDate(start.getDate() - 14);
    const end = new Date(now);
    end.setDate(end.getDate() - 7);
    return { start: formatDate(start), end: formatDate(end), label: "Last Week" };
  }
  if (/\b(?:last 7 days|past 7 days)\b/.test(q)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { start: formatDate(d), end: formatDate(now), label: "Last 7 Days" };
  }
  if (/\b(?:last 30 days|past 30 days)\b/.test(q)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return { start: formatDate(d), end: formatDate(now), label: "Last 30 Days" };
  }
  if (/\b(?:this month|current month)\b/.test(q)) {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: formatDate(d), end: formatDate(end), label: "This Month" };
  }
  if (/\b(?:last month|previous month)\b/.test(q)) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: formatDate(d), end: formatDate(end), label: "Last Month" };
  }
  
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  for (let i = 0; i < months.length; i++) {
    if (new RegExp(`\\b(in|for|during)\\s+${months[i]}[a-z]*\\b`, 'i').test(q)) {
      const d = new Date(now.getFullYear(), i, 1);
      const end = new Date(now.getFullYear(), i + 1, 0);
      return { start: formatDate(d), end: formatDate(end), label: fullMonths[i] };
    }
  }

  const mRegex = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spe)";
  const dayMonthRegex = new RegExp(`(?:on\\s+|from\\s+|for\\s+|in\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*${mRegex}(?:\\s+(\\d{4}))?\\b`, 'i');
  const monthDayRegex = new RegExp(`(?:on\\s+|from\\s+|for\\s+|in\\s+)?${mRegex}\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`, 'i');
  
  let match = q.match(dayMonthRegex);
  if (match) {
    const day = parseInt(match[1]);
    const monthIdx = months.findIndex(m => match![2].toLowerCase().startsWith(m));
    const year = match[3] ? parseInt(match[3]) : now.getFullYear();
    const d = new Date(year, monthIdx, day);
    return { start: formatDate(d), end: formatDate(d), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
  }

  match = q.match(monthDayRegex);
  if (match) {
    const day = parseInt(match[2]);
    const monthIdx = months.findIndex(m => match![1].toLowerCase().startsWith(m));
    const year = match[3] ? parseInt(match[3]) : now.getFullYear();
    const d = new Date(year, monthIdx, day);
    return { start: formatDate(d), end: formatDate(d), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
  }

  return undefined;
};

export const extractCategories = (query: string): string[] => {
  const q = query.toLowerCase();
  const cats: string[] = [];
  
  if (/\b(food|dining|restaurant|coffee|tea|cafe|lunch|dinner|pizza|burger|swiggy|zomato|kfc)\b/.test(q)) cats.push('Dining');
  if (/\b(fuel|petrol|diesel|transport|cab|uber|ola|bus|train|flight|auto)\b/.test(q)) cats.push('Transport');
  if (/\b(grocery|groceries|supermarket|vegetable|fruit|milk)\b/.test(q)) cats.push('Groceries');
  if (/\b(rent|bill|electricity|water|wifi|maintenance)\b/.test(q)) cats.push('Rent');
  if (/\b(shopping|cloth|clothes|shoes|amazon|flipkart|myntra)\b/.test(q)) cats.push('Shopping');
  if (/\b(medical|pharmacy|doctor|hospital|medicine|pill)\b/.test(q)) cats.push('Medical');
  if (/\b(movie|cinema|netflix|spotify|games|entertainment)\b/.test(q)) cats.push('Personal');
  if (/\b(travel|trip|hotel|resort|vacation)\b/.test(q)) cats.push('Travel');
  
  return [...new Set(cats)];
};

export const extractAction = (query: string): NlpContext['action'] => {
  const q = query.toLowerCase();
  
  if (/\b(compare)\b/.test(q)) {
    if (/\b(month|week|year)\b/.test(q)) return 'COMPARE_SPENDING';
    return 'COMPARE_CATEGORY';
  }
  if (/\b(average|avg)\b/.test(q)) return 'AVERAGE';
  if (/\b(how many|count|number of)\b/.test(q)) return 'COUNT';
  
  if (/\b(highest|biggest|most|largest|top|max)\b/.test(q)) {
    if (/\b(day|date)\b/.test(q)) return 'HIGHEST_DAY';
    if (/\b(category|type)\b/.test(q) || /\bwhere did (?:most of )?my money go\b/.test(q)) return 'HIGHEST_CATEGORY';
    return 'HIGHEST_SINGLE';
  }
  
  if (/\b(lowest|smallest|least|cheapest|min)\b/.test(q)) {
    if (/\b(day|date)\b/.test(q)) return 'LOWEST_DAY';
    if (/\b(category|type)\b/.test(q)) return 'LOWEST_CATEGORY';
    return 'LOWEST_SINGLE';
  }
  
  if (/\b(find|search)\b/.test(q)) return 'SEARCH';
  if (/\b(h[ow]?w much|total|sum|amount|spending|spendings|expens?ce?s?|spent|cost)\b/.test(q)) return 'TOTAL';

  return undefined;
};

export const parseNlpQuery = (query: string, previousContext?: NlpContext): NlpContext => {
  const extractedDate = extractDateRange(query);
  const extractedCats = extractCategories(query);
  const extractedAction = extractAction(query);

  let category = extractedCats[0];
  let category2 = extractedCats[1];
  
  const isFollowUp = /\b(what about|how about|and in|and on|and for)\b/.test(query.toLowerCase()) || 
                     (!extractedAction && (category || extractedDate));

  let action = extractedAction;
  let dateRange = extractedDate;

  if (isFollowUp && previousContext) {
    if (!action) action = previousContext.action;
    if (!category && previousContext.category && !extractedCats.length) category = previousContext.category;
    if (!dateRange && previousContext.dateRange && !extractedDate) dateRange = previousContext.dateRange;
  }

  if (!action && (category || dateRange)) {
    action = 'TOTAL';
  }

  return {
    action,
    category,
    category2,
    dateRange,
    originalQuery: query
  };
};

