import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { PaymentMethod } from "./saleApi";

/** One line as the invoice left it, with how much of it can still come back. */
export interface IReturnableLine {
  index: number;
  product: string;
  variantId?: string | null;
  name: string;
  variantName?: string;
  sku: string;
  unit?: string;
  quantity: number;
  returned: number;
  returnable: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IReturnableInvoice {
  invoiceNo: string;
  saleDate: string;
  customerName?: string;
  due: number;
  grandTotal: number;
  returnedAmount: number;
  lines: IReturnableLine[];
}

export interface ISaleReturn {
  _id: string;
  returnNo: string;
  sale: string;
  invoiceNo: string;
  customerName?: string;
  customerPhone?: string;
  items: {
    name: string;
    variantName?: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    restock: boolean;
  }[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  restoredCost: number;
  mode: "cash" | "credit";
  refundAmount: number;
  refundMethod?: PaymentMethod;
  creditedToDue: number;
  reason?: string;
  returnedAt: string;
  handledByName?: string;
}

const saleReturnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSaleReturns: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/sale-returns",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["sale-returns"],
    }),

    /** What is left to return on one invoice, line by line. */
    getReturnableLines: builder.query({
      query: (saleId: string) => ({
        url: `/sale-returns/returnable/${saleId}`,
        method: "GET",
      }),
      providesTags: ["sale-returns"],
    }),

    getReturnsOfSale: builder.query({
      query: (saleId: string) => ({
        url: `/sale-returns/sale/${saleId}`,
        method: "GET",
      }),
      providesTags: ["sale-returns"],
    }),

    createSaleReturn: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/sale-returns",
        method: "POST",
        body: data,
      }),
      // A return moves stock, the invoice, the customer's balance and every
      // money report — all of them are stale the moment it is saved.
      invalidatesTags: [
        "sale-returns",
        "sales",
        "products",
        "customers",
        "reports",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSaleReturnsQuery,
  useLazyGetSaleReturnsQuery,
  useGetReturnableLinesQuery,
  useGetReturnsOfSaleQuery,
  useCreateSaleReturnMutation,
} = saleReturnApi;
