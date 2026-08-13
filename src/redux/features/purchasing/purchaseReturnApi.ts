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

/** One instalment of a refund the supplier owed us. */
export interface IRefundReceipt {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  receivedAt: string;
  note?: string;
  createdByName?: string;
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
  mode: "cash" | "credit" | "pending";
  /** Money actually in hand. Grows as receipts land on a pending return. */
  refundAmount: number;
  refundMethod?: PaymentMethod;
  creditedToDue: number;
  /** Still owed to us by the supplier. */
  refundDue: number;
  receipts?: IRefundReceipt[];
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

    /**
     * Every return still waiting on its money, whatever page it is on.
     *
     * Its own call rather than a sum of the rows on screen: "how much are we
     * owed" is the one figure here that somebody acts on, and a total that
     * quietly means "of the twenty rows you can see" is worse than none.
     */
    getOutstandingRefunds: builder.query({
      query: () => ({
        url: "/purchase-returns/outstanding",
        method: "GET",
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

    recordRefundReceipt: builder.mutation({
      query: ({ id, ...body }: { id: string } & Record<string, unknown>) => ({
        url: `/purchase-returns/${id}/refund`,
        method: "PATCH",
        body,
      }),
      // No stock moves here, only money — but the vendor balance and every
      // cash report shift the moment it lands.
      invalidatesTags: ["purchase-returns", "vendors", "reports"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPurchaseReturnsQuery,
  useLazyGetPurchaseReturnsQuery,
  useGetOutstandingRefundsQuery,
  useGetReturnableBillLinesQuery,
  useGetReturnsOfPurchaseQuery,
  useCreatePurchaseReturnMutation,
  useRecordRefundReceiptMutation,
} = purchaseReturnApi;
