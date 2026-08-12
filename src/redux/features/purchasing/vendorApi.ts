import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export interface IVendor {
  _id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  note?: string;

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
