import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export type ActivityType =
  | "purchase"
  | "call"
  | "sms"
  | "visit"
  | "note"
  | "complaint"
  | "followup";

export interface ICustomerActivity {
  _id: string;
  customer: string;
  type: ActivityType;
  summary: string;
  detail?: string;
  sale?: { _id: string; invoiceNo: string; grandTotal: number } | string | null;
  amount?: number;
  followUpAt?: string | null;
  followUpDone: boolean;
  happenedAt: string;
  createdByName?: string;
}

export interface IDormantCustomer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  totalDue: number;
  saleCount: number;
  lastPurchaseAt: string;
  daysSinceLastPurchase: number | null;
  averageSale: number;
}

const crmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Purchases, calls, visits and notes in one feed — see the service note. */
    getActivityFeed: builder.query({
      query: (customerId: string) => ({
        url: `/crm/activity/${customerId}`,
        method: "GET",
      }),
      providesTags: ["crm"],
    }),

    getCustomerProfile: builder.query({
      query: (customerId: string) => ({
        url: `/crm/profile/${customerId}`,
        method: "GET",
      }),
      providesTags: ["crm", "customers", "sales"],
    }),

    /** Sorted by what they used to spend, not by how long they have been gone. */
    getDormantCustomers: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/crm/dormant",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["crm", "customers"],
    }),

    getDueFollowUps: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/crm/follow-ups",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["crm"],
    }),

    getEmployeeSales: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/crm/employee-sales",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["crm", "sales"],
    }),

    getProductBuyers: builder.query({
      query: (productId: string) => ({
        url: `/crm/product-buyers/${productId}`,
        method: "GET",
      }),
      providesTags: ["crm", "sales"],
    }),

    logActivity: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/crm/activity",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["crm"],
    }),

    completeFollowUp: builder.mutation({
      query: (id: string) => ({
        url: `/crm/activity/${id}/done`,
        method: "PATCH",
      }),
      invalidatesTags: ["crm"],
    }),

    deleteActivity: builder.mutation({
      query: (id: string) => ({ url: `/crm/activity/${id}`, method: "DELETE" }),
      invalidatesTags: ["crm"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetActivityFeedQuery,
  useGetCustomerProfileQuery,
  useGetDormantCustomersQuery,
  useGetDueFollowUpsQuery,
  useGetEmployeeSalesQuery,
  useGetProductBuyersQuery,
  useLogActivityMutation,
  useCompleteFollowUpMutation,
  useDeleteActivityMutation,
} = crmApi;
