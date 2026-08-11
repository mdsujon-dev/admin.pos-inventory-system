import { baseApi } from "../../api/baseApi";

const transactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.type) q.append("type", params.type);
        if (params?.page) q.append("page", params.page.toString());
        if (params?.limit) q.append("limit", params.limit.toString());
        if (params?.search) q.append("search", params.search);
        if (params?.startDate) q.append("startDate", params.startDate);
        if (params?.endDate) q.append("endDate", params.endDate);
        return { url: `transactions?${q.toString()}`, method: "GET" };
      },
      transformResponse: (response: { data: any[]; meta: any }) => ({
        result: response.data || [],
        meta: response.meta || {},
      }),
      providesTags: ["transactions"],
    }),
    getTransactionStats: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.type) q.append("type", params.type);
        if (params?.search) q.append("search", params.search);
        if (params?.startDate) q.append("startDate", params.startDate);
        if (params?.endDate) q.append("endDate", params.endDate);
        return { url: `transactions/stats?${q.toString()}`, method: "GET" };
      },
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ["transactions"],
    }),
    // Last 6 months of actual income vs (net) expense — the dashboard chart.
    getTransactionMonthly: builder.query<any[], { startDate?: string; endDate?: string } | void>({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.startDate) q.append("startDate", params.startDate);
        if (params?.endDate) q.append("endDate", params.endDate);
        return { url: `transactions/monthly?${q.toString()}`, method: "GET" };
      },
      transformResponse: (response: { data: any[] }) => response.data || [],
      providesTags: ["transactions"],
    }),
    addTransaction: builder.mutation({
      query: (body) => ({ url: "transactions", method: "POST", body }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ["transactions"],
    }),
    updateTransaction: builder.mutation({
      query: ({ id, data }) => ({
        url: `transactions/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ["transactions"],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  // Fired on demand by the export button, which needs every matching row
  // rather than the page being shown.
  useLazyGetTransactionsQuery,
  useGetTransactionStatsQuery,
  useGetTransactionMonthlyQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
} = transactionApi;
