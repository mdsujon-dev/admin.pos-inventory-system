import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { IPaymentDetails } from "../purchasing/vendorPaymentApi";
import { PaymentMethod } from "./saleApi";

export interface ICustomerPaymentAllocation {
  sale: string;
  invoiceNo: string;
  amount: number;
}

export interface ICustomerPayment {
  _id: string;
  receiptNo: string;
  customer?: string | null;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  details?: IPaymentDetails;
  note?: string;
  /** Which invoices this money settled — oldest first unless told otherwise. */
  allocations: ICustomerPaymentAllocation[];
  /** Taken with nothing outstanding to put it against; sits as credit. */
  unallocated: number;
  /** Written by the till as the sale was rung up, rather than collected later. */
  atTill: boolean;
  receivedAt: string;
  createdByName?: string;
  createdAt: string;
}

const customerPaymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerPayments: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/customer-payments",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["customer-payments"],
    }),

    getPaymentsOfCustomer: builder.query({
      query: (customerId: string) => ({
        url: `/customer-payments/customer/${customerId}`,
        method: "GET",
      }),
      providesTags: ["customer-payments"],
    }),

    /** Every receipt against one invoice — what the invoice screen lists. */
    getReceiptsOfSale: builder.query({
      query: (saleId: string) => ({
        url: `/customer-payments/sale/${saleId}`,
        method: "GET",
      }),
      providesTags: ["customer-payments"],
    }),

    /** Money off a customer's tab, spread oldest invoice first. */
    createCustomerPayment: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/customer-payments",
        method: "POST",
        body: data,
      }),
      // A receipt settles invoices and moves the customer's balance, so the
      // invoice list, the customer and every money report are stale after it.
      invalidatesTags: [
        "customer-payments",
        "sales",
        "customers",
        "reports",
        "crm",
      ],
    }),

    /** Money against one named invoice, rather than whatever is oldest. */
    recordPaymentOnSale: builder.mutation({
      query: ({ saleId, ...body }: { saleId: string } & Record<string, unknown>) => ({
        url: `/customer-payments/sale/${saleId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        "customer-payments",
        "sales",
        "customers",
        "reports",
        "crm",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomerPaymentsQuery,
  useLazyGetCustomerPaymentsQuery,
  useGetPaymentsOfCustomerQuery,
  useGetReceiptsOfSaleQuery,
  useCreateCustomerPaymentMutation,
  useRecordPaymentOnSaleMutation,
} = customerPaymentApi;
