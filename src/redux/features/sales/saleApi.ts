import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { ICustomer } from "./customerApi";

export type PaymentMethod =
  | "cash"
  | "bkash"
  | "nagad"
  | "rocket"
  | "bank"
  | "card"
  | "other";

export type SaleStatus = "paid" | "partial" | "due";

/** One sellable thing, as the scan endpoint returns it. */
export interface IScanHit {
  product: string;
  variantId: string | null;
  name: string;
  variantName: string;
  sku: string;
  barcode: string;
  image: string | null;
  unit: string;
  /** What it rings up at — the offer price when one is set. */
  price: number;
  listPrice: number;
  available: number;
  expiryDate: string | null;
}

export interface ISaleItem {
  _id?: string;
  product: string;
  variantId?: string | null;
  name: string;
  variantName?: string;
  sku: string;
  barcode?: string;
  image?: string | null;
  unit?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  lineTotal: number;
  /** Average of the batches consumed — see `lots` for the breakdown. */
  unitCost: number;
  costTotal: number;
  lots: { lot: string; quantity: number; unitCost: number; cost: number }[];
}

export interface ISale {
  _id: string;
  invoiceNo: string;
  customer?: Pick<ICustomer, "_id" | "name" | "phone" | "address"> | string | null;
  customerName?: string;
  customerPhone?: string;
  items: ISaleItem[];
  subtotal: number;
  itemDiscountTotal: number;
  billDiscount: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  paid: number;
  due: number;
  changeGiven: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  totalCost: number;
  profit: number;
  note?: string;
  soldByName?: string;
  saleDate: string;
  createdAt: string;
}

const saleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * One code in, one sellable thing out.
     *
     * A mutation rather than a query on purpose: scanning the same barcode
     * twice must hit the server twice, because the second scan is a second
     * item and RTK Query would serve the first one from cache.
     */
    scanCode: builder.mutation({
      query: (code: string) => ({
        url: `/products/scan/${encodeURIComponent(code)}`,
        method: "GET",
      }),
    }),

    getSales: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/sales",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["sales"],
    }),

    getSaleById: builder.query({
      query: (id: string) => ({ url: `/sales/${id}`, method: "GET" }),
      providesTags: ["sales"],
    }),

    getSalesSummary: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/sales/summary",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["sales"],
    }),

    createSale: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/sales",
        method: "POST",
        body: data,
      }),
      // A sale moves stock, the customer's balance and every report there is.
      invalidatesTags: [
        "sales",
        "customers",
        "products",
        "stock-lots",
        "reports",
        "crm",
      ],
    }),

    recordSalePayment: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/sales/${id}/payment`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["sales", "customers", "reports"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useScanCodeMutation,
  useGetSalesQuery,
  useGetSaleByIdQuery,
  useGetSalesSummaryQuery,
  useCreateSaleMutation,
  useRecordSalePaymentMutation,
} = saleApi;
