// Finance aggregation for the dashboard.
//
// There is no accounting/orders module yet, so "revenue" is estimated from the
// budgets leads state on quotation requests (a pipeline proxy). Expenses have
// no data source — they default to 0 until one is wired in.

type Quotation = { createdAt?: string; budget?: string | number };

/** Pull a numeric amount out of a free-text budget (e.g. "৳5,000", "5000-8000"). */
export const parseBudget = (b?: string | number): number => {
  if (b == null) return 0;
  if (typeof b === "number") return isFinite(b) ? b : 0;
  const nums = String(b).replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!nums) return 0;
  // For a stated range take the upper bound.
  return Math.max(...nums.map(Number));
};

export const totalRevenue = (quotations: Quotation[] = []): number =>
  quotations.reduce((sum, q) => sum + parseBudget(q.budget), 0);

export interface FinanceTotals {
  income: number;
  expenses: number;
  profit: number;
}

export const financeTotals = (
  quotations: Quotation[] = [],
  expenses = 0
): FinanceTotals => {
  const income = totalRevenue(quotations);
  return { income, expenses, profit: income - expenses };
};

export interface MonthPoint {
  label: string;
  income: number;
  expenses: number;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

/** Estimated revenue vs expenses per month, last N months (oldest → newest). */
export const monthlyFinance = (
  quotations: Quotation[] = [],
  months = 6
): MonthPoint[] => {
  const now = new Date();
  const buckets: { key: string; label: string }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: monthKey(d),
      label: d.toLocaleDateString("en-GB", { month: "short" }),
    });
  }

  const incomeByMonth = new Map<string, number>();
  quotations.forEach((q) => {
    if (!q.createdAt) return;
    const d = new Date(q.createdAt);
    if (isNaN(d.getTime())) return;
    const k = monthKey(d);
    incomeByMonth.set(k, (incomeByMonth.get(k) || 0) + parseBudget(q.budget));
  });

  return buckets.map((b) => ({
    label: b.label,
    income: incomeByMonth.get(b.key) || 0,
    expenses: 0, // no expense data source yet
  }));
};
