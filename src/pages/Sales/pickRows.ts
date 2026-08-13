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
}

/** Media paths come back relative; the till needs them absolute. */
export const imageUrl = (path?: string | null) =>
  !path ? null : path.startsWith("http") ? path : `${config.image_access_url}${path}`;

const offerOf = (row: { sellingPrice: number; discountPrice?: number | null }) =>
  row.discountPrice && row.discountPrice > 0 && row.discountPrice < row.sellingPrice
    ? row.discountPrice
    : row.sellingPrice;

export const toPickRows = (products: IProduct[]): PickRow[] =>
  products.flatMap((product) => {
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
          image: variant.image ?? product.images?.[0] ?? null,
        };
      })
      .filter((row): row is PickRow => row !== null);
  });

