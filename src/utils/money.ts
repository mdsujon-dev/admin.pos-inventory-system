/**
 * One place that knows how an amount is written down.
 *
 * Every screen that formats its own totals ends up with its own answer —
 * 1500, 1,500, ৳1500.00 — and a report that disagrees with the invoice it was
 * built from is a report nobody believes. The Taka glyph itself is left to the
 * `Money` component, which draws it as an icon; these return the number only.
 */

/** "1,500" / "1,500.50" — grouped, and decimals only when there are any. */
export const formatAmount = (value?: number | null): string => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-BD", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

/** Always two places — for columns of figures that have to line up. */
export const formatExact = (value?: number | null): string =>
  (Number(value) || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** "12.5%" — one place, because a margin to four decimals helps nobody. */
export const formatPercent = (value?: number | null): string =>
  `${(Number(value) || 0).toFixed(1)}%`;

/**
 * Rounds the way the server does, so a total added up in the browser and the
 * same total added up in the API cannot end a taka apart.
 */
export const round2 = (value: number): number =>
  Math.round((Number(value) || 0) * 100) / 100;

/** "1.2k" / "3.4L" — for tiles where the exact figure would not fit. */
export const formatCompact = (value?: number | null): string => {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  // Lakh, not million: this panel is read in Bangladesh.
  if (abs >= 10000000) return `${(amount / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${(amount / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return formatAmount(amount);
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank",
  card: "Card",
  other: "Other",
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS);
