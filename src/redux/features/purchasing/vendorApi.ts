import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

import { ICategory } from "../inventory/categoryApi";
import { ISubCategory } from "../inventory/subCategoryApi";

/** Populated on a read, sent back as plain ids on a write. */
type Ref<T> = T | string;

export interface IPaymentMethod {
  methodType: string;
  provider?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  details?: string;
}

export interface IVendor {
  _id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  note?: string;

  /**
   * What they supply, as headings rather than a product list — a supplier like
   * RFL carries hundreds of lines, and the categories are what answers "who do
   * we call for this".
   */
  categories: Ref<Pick<ICategory, "_id" | "name">>[];
  subCategories: Ref<Pick<ISubCategory, "_id" | "name">>[];

  /** How they get paid, written down once instead of asked for every time. */
  paymentTerms?: string;
  creditDays?: number;
  paymentMethods?: IPaymentMethod[];

  /** Written by purchases, never by the edit form. */
  totalPurchased: number;
  totalPaid: number;
  totalDue: number;
  purchaseCount: number;
  lastPurchaseAt?: string | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/vendors",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["vendors"],
    }),

    getVendorById: builder.query({
      query: (id: string) => ({ url: `/vendors/${id}`, method: "GET" }),
      providesTags: ["vendors"],
    }),

    createVendor: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/vendors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["vendors"],
    }),

    updateVendor: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/vendors/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["vendors"],
    }),

    toggleVendorStatus: builder.mutation({
      query: (id: string) => ({ url: `/vendors/${id}/status`, method: "PATCH" }),
      invalidatesTags: ["vendors"],
    }),

    deleteVendor: builder.mutation({
      query: (id: string) => ({ url: `/vendors/${id}`, method: "DELETE" }),
      invalidatesTags: ["vendors"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useToggleVendorStatusMutation,
  useDeleteVendorMutation,
} = vendorApi;
