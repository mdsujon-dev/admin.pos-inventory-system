import { useCallback, useMemo, useState } from "react";
import { IScanHit } from "../../redux/features/sales/saleApi";
import { round2 } from "../../utils/money";

/** A line in the till's cart, before it is sent to the API. */
export interface CartLine extends IScanHit {
  /** product id + variant id — one sellable thing, one row. */
  key: string;
  quantity: number;
  /** Taken off this line only, in currency. */
  discount: number;
}

const keyOf = (hit: { product: string; variantId: string | null }) =>
  `${hit.product}:${hit.variantId ?? "-"}`;

export interface CartTotals {
  subtotal: number;
  itemDiscountTotal: number;
  billDiscount: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  unitCount: number;
  lineCount: number;
}

/**
 * The cart behind the till.
 *
 * Kept out of the screen because the arithmetic is the part that must be
 * right — the totals shown to a customer and the totals the server recomputes
 * have to agree to the taka, or the cashier is arguing with the till in front
 * of a queue.
 *
 * Prices are still the server's answer. What is held here is only what was
 * scanned and how many; the API re-reads every price when the sale is saved.
 */
export const useCart = () => {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [vatPercent, setVatPercent] = useState(0);

  /**
   * Scanning the same item twice means two of it, not two rows.
   *
   * A cashier passing five identical tins over the scanner expects one line
   * reading five — five separate lines is a receipt nobody can check.
   */
  const addHit = useCallback((hit: IScanHit): { ok: boolean; message?: string } => {
    const key = keyOf(hit);
    let refusal: string | undefined;

    setLines((previous) => {
      const existing = previous.find((line) => line.key === key);

      if (!existing) {
        return [{ ...hit, key, quantity: 1, discount: 0 }, ...previous];
      }

      // The shelf is the limit, and the scan told us what is on it.
      if (existing.quantity + 1 > hit.available) {
        refusal = `Only ${hit.available} of "${hit.name}${
          hit.variantName ? ` — ${hit.variantName}` : ""
        }" in stock`;
        return previous;
      }

      return previous.map((line) =>
        line.key === key ? { ...line, quantity: line.quantity + 1 } : line
      );
    });

    return { ok: !refusal, message: refusal };
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((previous) =>
      previous.map((line) =>
        line.key === key
          ? {
              ...line,
              quantity: Math.max(1, Math.min(quantity, line.available)),
            }
          : line
      )
    );
  }, []);

  const setDiscount = useCallback((key: string, discount: number) => {
    setLines((previous) =>
      previous.map((line) =>
        line.key === key
          ? {
              // A discount larger than the line is a giveaway, not an offer.
              ...line,
              discount: Math.max(
                0,
                Math.min(discount, line.price * line.quantity)
              ),
            }
          : line
      )
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((previous) => previous.filter((line) => line.key !== key));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setBillDiscount(0);
    setVatPercent(0);
  }, []);

  /** Replaces the whole cart — used when a held sale is brought back. */
  const restore = useCallback(
    (held: { lines: CartLine[]; billDiscount: number; vatPercent: number }) => {
      setLines(held.lines);
      setBillDiscount(held.billDiscount);
      setVatPercent(held.vatPercent);
    },
    []
  );

  const totals: CartTotals = useMemo(() => {
    const subtotal = round2(
      lines.reduce(
        (sum, line) => sum + line.price * line.quantity - line.discount,
        0
      )
    );
    const itemDiscountTotal = round2(
      lines.reduce((sum, line) => sum + line.discount, 0)
    );
    const cappedBill = Math.min(billDiscount, subtotal);
    const taxable = round2(subtotal - cappedBill);
    const vatAmount = round2((taxable * vatPercent) / 100);

    return {
      subtotal,
      itemDiscountTotal,
      billDiscount: cappedBill,
      vatPercent,
      vatAmount,
      grandTotal: round2(taxable + vatAmount),
      unitCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      lineCount: lines.length,
    };
  }, [lines, billDiscount, vatPercent]);

  /** The shape the API wants: identity and counts only, never prices. */
  const toPayloadItems = useCallback(
    () =>
      lines.map((line) => ({
        product: line.product,
        variantId: line.variantId,
        quantity: line.quantity,
        discount: line.discount,
      })),
    [lines]
  );

  return {
    lines,
    totals,
    billDiscount,
    setBillDiscount,
    vatPercent,
    setVatPercent,
    addHit,
    setQuantity,
    setDiscount,
    removeLine,
    clear,
    restore,
    toPayloadItems,
  };
};
