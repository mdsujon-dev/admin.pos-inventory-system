import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { PaymentMethod } from "../sales/saleApi";
import { IVendor } from "./vendorApi";

export type PurchaseStatus = "paid" | "partial" | "due";

export interface IPurchaseItem {
  _id?: string;
  product: string;
  variantId?: string | null;
  name: string;
  variantName?: string;
  sku: string;
  quantity: number;
  /** What the vendor charged, before freight. */
  unitCost: number;
  /** This line's share of the bill's freight, per unit. */
  landedExtra: number;
  lineTotal: number;
  expiryDate?: string | null;
  lot?: string | null;
}

export interface IPurchase {
  _id: string;
  purchaseNo: string;
  billNo?: string;
  vendor: Pick<IVendor, "_id" | "name" | "company" | "phone"> | string;
  vendorName: string;
  vendorPhone?: string;
  items: IPurchaseItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  otherCost: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  paid: number;
  due: number;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  purchaseDate: string;
  note?: string;
  createdByName?: string;
  createdAt: string;
}

/** A batch of stock at one cost — what FIFO consumes. */
export interface IStockLot {
  _id: string;
  product: string;
  variantId?: string | null;
  purchase?: { _id: string; billNo?: string; purchaseDate: string } | string | null;
  vendor?: Pick<IVendor, "_id" | "name" | "company" | "phone"> | string | null;
  unitCost: number;
  quantity: number;
  remaining: number;
  receivedAt: string;
  expiryDate?: string | null;
  reference?: string;
  note?: string;
}

const purchaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchases: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/purchases",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["purchases"],
    }),

    getPurchaseById: builder.query({
      query: (id: string) => ({ url: `/purchases/${id}`, method: "GET" }),
      providesTags: ["purchases"],
    }),

    /** Every bill from one vendor, what is owed, and what we buy from them. */
    getVendorLedger: builder.query({
      query: ({ vendorId, args }: { vendorId: string; args?: QueryArg[] }) => ({
        url: `/purchases/ledger/${vendorId}`,
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["purchases", "vendors"],
    }),

    /** Every batch of one product — where it came from and what is left. */
    getProductLots: builder.query({
      query: ({
        productId,
        includeSpent,
      }: {
        productId: string;
        includeSpent?: boolean;
      }) => ({
        url: `/purchases/lots/${productId}`,
        method: "GET",
        params: buildQueryParams(
          includeSpent ? [{ name: "includeSpent", value: "true" }] : []
        ),
      }),
      providesTags: ["stock-lots"],
    }),

    createPurchase: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/purchases",
        method: "POST",
        body: data,
      }),
      // A purchase opens stock lots and moves the vendor's balance, so the
      // catalog, the batches and every report are all stale after it.
      invalidatesTags: [
        "purchases",
        "vendors",
        "products",
        "stock-lots",
        "reports",
      ],
    }),

    recordPurchasePayment: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/purchases/${id}/payment`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["purchases", "vendors", "reports"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseByIdQuery,
  useGetVendorLedgerQuery,
  useGetProductLotsQuery,
  useCreatePurchaseMutation,
  useRecordPurchasePaymentMutation,
} = purchaseApi;
