import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { PaymentMethod } from "../sales/saleApi";
import { IVendor } from "./vendorApi";

export interface IVendorPaymentAllocation {
  purchase: string;
  purchaseNo: string;
  amount: number;
}

export interface IVendorPayment {
  _id: string;
  paymentNo: string;
  vendor: Pick<IVendor, "_id" | "name" | "company" | "phone"> | string;
  vendorName: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
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
  useGetPaymentsOfVendorQuery,
  useCreateVendorPaymentMutation,
} = vendorPaymentApi;
