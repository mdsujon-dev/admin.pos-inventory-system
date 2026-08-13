import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export interface IExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  /** Rent and salary recur; repairs do not. Worth separating in reports. */
  isRecurring: boolean;
  isActive: boolean;
}

export interface IProfitAndLoss {
  invoiceCount: number;
  /** Trading revenue, VAT excluded — the tax is not the shop's to count. */
  revenue: number;
  grossBilled: number;
  vatCollected: number;
  discountGiven: number;
  /** From the FIFO batches the invoices actually consumed. */
  costOfGoods: number;
  grossProfit: number;
  grossMargin: number;
  otherIncome: number;
  operatingExpense: number;
  expenseByCategory: {
    categoryId: string | null;
    name: string;
    amount: number;
    entryCount: number;
  }[];
  netProfit: number;
  netMargin: number;
  collected: number;
  outstanding: number;
}

export interface IStockValuation {
  items: {
    productId: string;
    variantId: string | null;
    name: string;
    variantName: string;
    sku: string;
    quantity: number;
    value: number;
    averageCost: number;
    oldestReceivedAt: string;
    lotCount: number;
  }[];
  totalQuantity: number;
  totalValue: number;
}

const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfitAndLoss: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/reports/profit-loss",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["reports"],
    }),

    getStockValuation: builder.query({
      query: () => ({ url: "/reports/stock-valuation", method: "GET" }),
      providesTags: ["reports", "stock-lots"],
    }),

    getPotentialProfit: builder.query({
      query: () => ({ url: "/reports/potential-profit", method: "GET" }),
      providesTags: ["reports", "stock-lots"],
    }),

    getReceivables: builder.query({
      query: () => ({ url: "/reports/receivables", method: "GET" }),
      providesTags: ["reports", "sales"],
    }),

    getPayables: builder.query({
      query: () => ({ url: "/reports/payables", method: "GET" }),
      providesTags: ["reports", "purchases"],
    }),

    getCashFlow: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/reports/cash-flow",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["reports"],
    }),

    getProductProfitability: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/reports/product-profitability",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["reports"],
    }),

    getDashboardSummary: builder.query({
      query: () => ({ url: "/reports/dashboard", method: "GET" }),
      providesTags: ["reports"],
    }),

    /** Every money movement, assembled from the documents themselves. */
    getLedger: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/reports/ledger",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["reports"],
    }),

    getExpenseCategories: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/expense-categories",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["expense-categories"],
    }),

    createExpenseCategory: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/expense-categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["expense-categories"],
    }),

    updateExpenseCategory: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/expense-categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["expense-categories"],
    }),

    toggleExpenseCategoryStatus: builder.mutation({
      query: (id: string) => ({
        url: `/expense-categories/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["expense-categories"],
    }),

    deleteExpenseCategory: builder.mutation({
      query: (id: string) => ({
        url: `/expense-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["expense-categories"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfitAndLossQuery,
  useGetStockValuationQuery,
  useGetPotentialProfitQuery,
  useGetReceivablesQuery,
  useGetPayablesQuery,
  useGetCashFlowQuery,
  useGetProductProfitabilityQuery,
  useGetDashboardSummaryQuery,
  useGetLedgerQuery,
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useToggleExpenseCategoryStatusMutation,
  useDeleteExpenseCategoryMutation,
} = reportApi;
