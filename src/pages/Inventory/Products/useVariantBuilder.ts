import { useCallback, useState } from "react";
import {
  IProductVariant,
  IProductVariantOption,
} from "../../../redux/features/inventory/productApi";

/** A row in the variant editor, before it is sent to the API. */
export type DraftVariant = IProductVariant & { key: string };

/** Stable identity for a combination, independent of option order. */
export const signatureOf = (options: IProductVariantOption[]) =>
  options
    .map((option) => `${option.attribute}:${option.value}`.toLowerCase())
    .sort()
    .join("|");

/**
 * Every combination of the chosen values — {Color: [Red, Blue], Size: [S, M]}
 * becomes the four Red/S, Red/M, Blue/S, Blue/M.
 */
export const cartesian = (
  selections: { attribute: string; values: string[] }[]
): IProductVariantOption[][] => {
  const usable = selections.filter((selection) => selection.values.length > 0);
  if (usable.length === 0) return [];

  return usable.reduce<IProductVariantOption[][]>(
    (rows, selection) =>
      rows.flatMap((row) =>
        selection.values.map((value) => [
          ...row,
          { attribute: selection.attribute, value },
        ])
      ),
    [[]]
  );
};

const skuSuffix = (options: IProductVariantOption[]) =>
  options
    .map((option) =>
      option.value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "")
        .slice(0, 6)
    )
    .filter(Boolean)
    .join("-");

let blankCounter = 0;

const emptyVariant = (key: string, name = ""): DraftVariant => ({
  key,
  name,
  options: [],
  sku: "",
  barcode: "",
  weight: null,
  purchasePrice: 0,
  cost: 0,
  totalCost: 0,
  sellingPrice: 0,
  discountPrice: null,
  quantity: 0,
  lowStockAlert: null,
  expiryDate: null,
  image: null,
  images: [],
  isActive: true,
});

interface BuilderOptions {
  /** Seeds the editor when editing an existing variable product. */
  initial?: IProductVariant[];
}

/**
 * Holds the variant list for the product form.
 *
 * Rows arrive two ways — typed in one at a time, or generated from attribute
 * combinations — and both land in the same list, because by the time a variant
 * is priced and stocked it no longer matters which way it was created.
 */
export const useVariantBuilder = ({ initial = [] }: BuilderOptions = {}) => {
  const [variants, setVariants] = useState<DraftVariant[]>(() =>
    initial.map((variant, index) => ({
      ...variant,
      key: variant._id ?? `existing-${index}`,
    }))
  );

  /** Adds one blank row for the user to fill in by hand. */
  const addVariant = useCallback(() => {
    blankCounter += 1;
    setVariants((previous) => [
      ...previous,
      emptyVariant(`blank-${blankCounter}`),
    ]);
  }, []);

  const generate = useCallback(
    (
      selections: { attribute: string; values: string[] }[],
      baseSku: string
    ) => {
      const combinations = cartesian(selections);

      setVariants((previous) => {
        const bySignature = new Map(
          previous
            .filter((variant) => variant.options.length > 0)
            .map((variant) => [signatureOf(variant.options), variant])
        );

        const generated = combinations.map((options, index) => {
          // Preserved so adding a third colour does not wipe the prices and
          // stock counts already typed into the other rows.
          const existing = bySignature.get(signatureOf(options));
          if (existing) return existing;

          const suffix = skuSuffix(options);
          const name = options.map((option) => option.value).join(" / ");
          return {
            ...emptyVariant(`generated-${signatureOf(options)}-${index}`, name),
            options,
            sku: baseSku ? `${baseSku}-${suffix}` : suffix,
          };
        });

        // Hand-added rows are left alone — regenerating the grid is about the
        // attribute combinations, and it should not delete someone's manual row.
        const manual = previous.filter((variant) => variant.options.length === 0);
        return [...generated, ...manual];
      });
    },
    []
  );

  const updateVariant = useCallback(
    (key: string, patch: Partial<DraftVariant>) => {
      setVariants((previous) =>
        previous.map((variant) =>
          variant.key === key ? { ...variant, ...patch } : variant
        )
      );
    },
    []
  );

  const removeVariant = useCallback((key: string) => {
    setVariants((previous) =>
      previous.filter((variant) => variant.key !== key)
    );
  }, []);

  const reset = useCallback(() => setVariants([]), []);

  return {
    variants,
    addVariant,
    generate,
    updateVariant,
    removeVariant,
    reset,
  };
};
