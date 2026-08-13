import { config } from "../../config";
import { IProduct } from "../../redux/features/inventory/productApi";

/** One thing that can be rung up: a product, or one variant of one. */
export interface PickRow {
  key: string;
  name: string;
  variantName: string;
  /** What the scan box would be given. */
  code: string;
  price: number;
  listPrice: number;
  stock: number;
  image: string | null;
  /** Who makes it. Narrows a search faster than the product name does. */
  brand: string;
  /** "kg", "pcs" — a price without its unit is half a fact. */
  unit: string;
  /** Below this the tile warns. Null when nobody set a level. */
  lowStockAt: number | null;
}

/** Media paths come back relative; the till needs them absolute. */
export const imageUrl = (path?: string | null) =>
  !path ? null : path.startsWith("http") ? path : `${config.image_access_url}${path}`;

const offerOf = (row: { sellingPrice: number; discountPrice?: number | null }) =>
  row.discountPrice && row.discountPrice > 0 && row.discountPrice < row.sellingPrice
    ? row.discountPrice
    : row.sellingPrice;

/** A populated reference, or nothing readable. */
const nameOf = (ref: unknown) =>
  ref && typeof ref === "object" ? ((ref as { name?: string }).name ?? "") : "";

const shortUnit = (ref: unknown) =>
  ref && typeof ref === "object"
    ? ((ref as { shortName?: string; name?: string }).shortName ??
      (ref as { name?: string }).name ??
      "")
    : "";

export const toPickRows = (products: IProduct[]): PickRow[] =>
  products.flatMap((product) => {
    const brand = nameOf(product.brand);
    const unit = shortUnit(product.unit);

    if (product.type === "single") {
      const code = product.barcode?.trim() || product.sku;
      return code
        ? [
            {
              key: product._id,
              name: product.name,
              variantName: "",
              code,
              price: offerOf(product),
              listPrice: product.sellingPrice,
              stock: product.quantity ?? 0,
              image: product.images?.[0] ?? null,
              brand,
              unit,
              lowStockAt: product.lowStockAlert ?? null,
            },
          ]
        : [];
    }

    return (product.variants ?? [])
      .map((variant): PickRow | null => {
        const code = variant.barcode?.trim() || variant.sku;
        if (!code) return null;
        return {
          key: `${product._id}-${variant._id ?? variant.sku}`,
          name: product.name,
          variantName:
            variant.options.map((option) => option.value).join(" / ") ||
            variant.name,
          code,
          price: offerOf(variant),
          listPrice: variant.sellingPrice,
          stock: variant.quantity ?? 0,
          brand,
          unit,
          lowStockAt: variant.lowStockAlert ?? null,
          /**
           * The variant's own picture, then its cover, then the product's.
           *
           * Same order the scan service uses, so a tile and the cart line it
           * becomes show the same thing — a variant that looks like one
           * product on the grid and another in the cart is how the wrong
           * colour gets handed over.
           *
           * `variant.images[0]` was missing here, which is why every variant
           * fell straight through to the parent's photo.
           */
          image:
            variant.images?.[0] ?? variant.image ?? product.images?.[0] ?? null,
        };
      })
      .filter((row): row is PickRow => row !== null);
  });

