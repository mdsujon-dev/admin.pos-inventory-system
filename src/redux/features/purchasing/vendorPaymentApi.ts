import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { PaymentMethod } from "../sales/saleApi";
import { IVendor } from "./vendorApi";

export interface IVendorPaymentAllocation {
  purchase: string;
  purchaseNo: string;
  amount: number;
}

/**
 * The bits only some methods have — a wallet's transaction has numbers, a
 * cheque has a date, cash has a person. Kept apart so the form asks for what
 * the chosen method actually uses instead of showing mostly-empty fields.
 */
export interface IPaymentDetails {
  senderNumber?: string;
  receiverNumber?: string;
  accountType?: string;
  bankName?: string;
  accountNumber?: string;
  branch?: string;
  chequeNo?: string;
  chequeDate?: string | null;
  cardLast4?: string;
  handedTo?: string;
  receivedBy?: string;
}

export interface IVendorPayment {
  _id: string;
  paymentNo: string;
  vendor: Pick<IVendor, "_id" | "name" | "company" | "phone"> | string;
  vendorName: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  details?: IPaymentDetails;
  note?: string;
  /** Which bills this money settled — oldest first unless told otherwise. */
  allocations: IVendorPaymentAllocation[];
  /** Paid with nothing outstanding to put it against; sits as credit. */
  unallocated: number;
  paidAt: string;
  createdByName?: string;
  createdAt: string;
}

const vendorPaymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVendorPayments: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/vendor-payments",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["vendor-payments"],
    }),

    getPaymentsOfVendor: builder.query({
      query: (vendorId: string) => ({
        url: `/vendor-payments/vendor/${vendorId}`,
        method: "GET",
      }),
      providesTags: ["vendor-payments"],
    }),

    /** Totals across every payment the current filters match, not just the page. */
    getVendorPaymentsSummary: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/vendor-payments/summary",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["vendor-payments"],
    }),

    createVendorPayment: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/vendor-payments",
        method: "POST",
        body: data,
      }),
      // A payment settles bills and moves the vendor's balance, so the bill
      // list, the vendor and every money report are stale after it.
      invalidatesTags: [
        "vendor-payments",
        "purchases",
        "vendors",
        "reports",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVendorPaymentsQuery,
  useGetVendorPaymentsSummaryQuery,
  useGetPaymentsOfVendorQuery,
  useCreateVendorPaymentMutation,
} = vendorPaymentApi;
