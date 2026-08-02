export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export function optimizeDebts(transactions: Transaction[]): Transaction[] {
  // Calculate net balance for each person
  const balances: Record<string, number> = {};

  for (const t of transactions) {
    if (!balances[t.from]) balances[t.from] = 0;
    if (!balances[t.to]) balances[t.to] = 0;
    
    balances[t.from] -= t.amount;
    balances[t.to] += t.amount;
  }

  // Separate into debtors (negative balance) and creditors (positive balance)
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    if (balance < -0.01) debtors.push({ id, amount: -balance });
    else if (balance > 0.01) creditors.push({ id, amount: balance });
  }

  // Sort by amount descending to greedily match largest debts first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const optimizedTransactions: Transaction[] = [];
  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);
    
    // Create optimized transaction
    optimizedTransactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Number(settledAmount.toFixed(2))
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return optimizedTransactions;
}
