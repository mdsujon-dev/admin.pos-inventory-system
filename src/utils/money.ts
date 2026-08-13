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

/**
 * What the one "proof" field is called, per method.
 *
 * The same field every time — one string that settles "did this money really
 * move" — but nobody calls a bKash trx id a reference, so the label follows
 * the method rather than making the cashier translate. Shared because money
 * arriving and money leaving ask for the same proof.
 */
export const PAYMENT_REFERENCE_LABELS: Record<string, string> = {
  cash: "Voucher no",
  bkash: "Transaction ID",
  nagad: "Transaction ID",
  rocket: "Transaction ID",
  bank: "Cheque / transfer no",
  card: "Approval code",
  other: "Reference",
};

export const PAYMENT_REFERENCE_HINTS: Record<string, string> = {
  cash: "e.g. VCH-1042",
  bkash: "e.g. 9F2K7XQ1PL",
  nagad: "e.g. 9F2K7XQ1PL",
  rocket: "e.g. 9F2K7XQ1PL",
  bank: "e.g. 004512 or the transfer id",
  card: "e.g. 013422",
  other: "Optional",
};
