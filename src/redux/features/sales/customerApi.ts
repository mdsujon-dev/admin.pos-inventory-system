import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export interface ICustomer {
  _id: string;
  name: string;
  /** Digits only — the API normalises it, so "01711-2233" and "017112233" are one. */
  phone: string;
  email?: string;
  address?: string;
  note?: string;

  /** Written by sales, never by the edit form. */
  totalSpent: number;
  totalDue: number;
  saleCount: number;
  lastPurchaseAt?: string | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/customers",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["customers"],
    }),

    getCustomerById: builder.query({
      query: (id: string) => ({ url: `/customers/${id}`, method: "GET" }),
      providesTags: ["customers"],
    }),

    /**
     * The till's lookup. A miss is a 200 with `data: null`, not a 404 — a new
     * number at a counter is normal, and a red error toast for it is wrong.
     */
    findCustomerByPhone: builder.query({
      query: (phone: string) => ({
        url: `/customers/phone/${encodeURIComponent(phone)}`,
        method: "GET",
      }),
      providesTags: ["customers"],
    }),

    createCustomer: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/customers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["customers"],
    }),

    updateCustomer: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["customers"],
    }),

    toggleCustomerStatus: builder.mutation({
      query: (id: string) => ({
        url: `/customers/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["customers"],
    }),

    deleteCustomer: builder.mutation({
      query: (id: string) => ({ url: `/customers/${id}`, method: "DELETE" }),
      invalidatesTags: ["customers"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useFindCustomerByPhoneQuery,
  useLazyFindCustomerByPhoneQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useToggleCustomerStatusMutation,
  useDeleteCustomerMutation,
} = customerApi;
