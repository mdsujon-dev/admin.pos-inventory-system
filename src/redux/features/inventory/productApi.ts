import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { IBrand } from "./brandApi";
import { ICategory } from "./categoryApi";
import { ISubCategory } from "./subCategoryApi";
import { IUnit } from "./unitApi";
import { IWarranty } from "./warrantyApi";

export type ProductType = "single" | "variable";

export interface IProductVariantOption {
  attribute: string;
  value: string;
}

/** The money on a sellable thing — same shape on a product and on a variant. */
export interface IPricing {
  purchasePrice: number;
  /** Freight, duty, handling. Optional. */
  cost: number;
  /** purchasePrice + cost. Derived server-side; read-only here. */
  totalCost: number;
  sellingPrice: number;
  /** Offer price. When set and lower than `sellingPrice`, this is what sells. */
  discountPrice?: number | null;
}

export interface IProductVariant extends IPricing {
  _id?: string;
  /** What the variant is called on the shelf — "Red / Small", "500g". */
  name: string;
  /** Present only on rows built by the attribute generator. */
  options: IProductVariantOption[];
  sku: string;
  barcode?: string | null;
  weight?: number | null;
  quantity: number;
  lowStockAlert?: number | null;
  expiryDate?: string | null;
  image?: string | null;
  images: string[];
  isActive: boolean;
}

/** Reference fields arrive populated from the API and are sent back as ids. */
type Ref<T> = T | string | null;

export interface IProduct extends IPricing {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  type: ProductType;

  category: Ref<Pick<ICategory, "_id" | "name" | "slug">>;
  subCategory?: Ref<Pick<ISubCategory, "_id" | "name" | "slug">>;
  brand?: Ref<Pick<IBrand, "_id" | "name" | "slug">>;
  unit: Ref<Pick<IUnit, "_id" | "name" | "shortName">>;
  warranty?: Ref<Pick<IWarranty, "_id" | "name" | "duration" | "period">>;

  description?: string;
  images: string[];

  weight?: number | null;

  barcode?: string | null;
  quantity: number;
  expiryDate?: string | null;
  lowStockAlert: number;

  variants: IProductVariant[];

  totalQuantity: number;
  isLowStock: boolean;
  nearestExpiryDate?: string | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reads the display name off a reference that may or may not be populated.
 * The list endpoints populate; a freshly submitted form holds plain ids.
 */
export const refName = (ref: unknown): string | null => {
  if (!ref || typeof ref === "string") return null;
  return (ref as { name?: string }).name ?? null;
};

/** The id of a reference, whichever of the two shapes it arrived in. */
export const refId = (ref: unknown): string | undefined => {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  return (ref as { _id?: string })._id;
};

const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/products",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["products"],
    }),

    getExpiredProducts: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/products/expired",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["products"],
    }),

    getLowStockProducts: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/products/low-stock",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["products"],
    }),

    getProductById: builder.query({
      query: (id: string) => ({
        url: `/products/${id}`,
        method: "GET",
      }),
      providesTags: ["products"],
    }),

    createProduct: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/products",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["products"],
    }),

    updateProduct: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["products"],
    }),

    toggleProductStatus: builder.mutation({
      query: (id: string) => ({
        url: `/products/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["products"],
    }),

    deleteProduct: builder.mutation({
      query: (id: string) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["products"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetExpiredProductsQuery,
  useLazyGetExpiredProductsQuery,
  useGetLowStockProductsQuery,
  useLazyGetLowStockProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useToggleProductStatusMutation,
  useDeleteProductMutation,
} = productApi;
