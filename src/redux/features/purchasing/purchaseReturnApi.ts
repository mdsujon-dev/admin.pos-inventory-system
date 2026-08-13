import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { PaymentMethod } from "../sales/saleApi";

/** One line as the bill received it, with how much can still go back. */
export interface IReturnableBillLine {
  index: number;
  name: string;
  variantName?: string;
  sku: string;
  quantity: number;
  returned: number;
  unitCost: number;
  returnable: number;
  stillOnShelf: number;
}

export interface IPurchaseReturn {
  _id: string;
  returnNo: string;
  purchase: string;
  purchaseNo: string;
  vendorName: string;
  items: {
    name: string;
    variantName?: string;
    sku: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }[];
  totalCost: number;
  totalQuantity: number;
  mode: "cash" | "credit";
  refundAmount: number;
  refundMethod?: PaymentMethod;
  creditedToDue: number;
  reason?: string;
  returnedAt: string;
  createdByName?: string;
}

const purchaseReturnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseReturns: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/purchase-returns",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["purchase-returns"],
    }),

    getReturnableBillLines: builder.query({
      query: (purchaseId: string) => ({
        url: `/purchase-returns/returnable/${purchaseId}`,
        method: "GET",
      }),
      providesTags: ["purchase-returns"],
    }),

    getReturnsOfPurchase: builder.query({
      query: (purchaseId: string) => ({
        url: `/purchase-returns/purchase/${purchaseId}`,
        method: "GET",
      }),
      providesTags: ["purchase-returns"],
    }),

    createPurchaseReturn: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/purchase-returns",
        method: "POST",
        body: data,
      }),
      // Stock leaves, the bill and the vendor balance move, and every money
      // report is stale the moment it lands.
      invalidatesTags: [
        "purchase-returns",
        "purchases",
        "products",
        "vendors",
        "reports",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPurchaseReturnsQuery,
  useLazyGetPurchaseReturnsQuery,
  useGetReturnableBillLinesQuery,
  useGetReturnsOfPurchaseQuery,
  useCreatePurchaseReturnMutation,
} = purchaseReturnApi;
