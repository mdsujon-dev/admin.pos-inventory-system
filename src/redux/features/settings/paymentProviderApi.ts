import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export interface IPaymentProvider {
  _id: string;
  name: string;
  type: "Bank" | "Mobile Banking" | "Other";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const paymentProviderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentProviders: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/payment-providers",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["paymentProviders"],
    }),

    createPaymentProvider: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/payment-providers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["paymentProviders"],
    }),

    updatePaymentProvider: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/payment-providers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["paymentProviders"],
    }),

    togglePaymentProviderStatus: builder.mutation({
      query: (id: string) => ({
        url: `/payment-providers/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["paymentProviders"],
    }),

    deletePaymentProvider: builder.mutation({
      query: (id: string) => ({
        url: `/payment-providers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["paymentProviders"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPaymentProvidersQuery,
  useCreatePaymentProviderMutation,
  useUpdatePaymentProviderMutation,
  useTogglePaymentProviderStatusMutation,
  useDeletePaymentProviderMutation,
} = paymentProviderApi;
