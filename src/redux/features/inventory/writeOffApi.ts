import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export const WRITE_OFF_REASONS = [
  { value: "expired", label: "Expired" },
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "stolen", label: "Stolen" },
  { value: "sample", label: "Given as sample" },
  { value: "correction", label: "Stocktake correction" },
] as const;

export interface IWriteOff {
  _id: string;
  writeOffNo: string;
  reason: string;
  note?: string;
  totalCost: number;
  totalQuantity: number;
  writtenOffAt: string;
  createdByName?: string;
  items: {
    name: string;
    variantName?: string;
    sku: string;
    quantity: number;
    unitCost: number;
    costTotal: number;
  }[];
}

const writeOffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWriteOffs: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/write-offs",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["write-offs"],
    }),

    createWriteOff: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/write-offs",
        method: "POST",
        body: data,
      }),
      // Stock leaves and the books take a loss, so the shelf and every money
      // report are both stale the moment this lands.
      invalidatesTags: ["write-offs", "products", "reports"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetWriteOffsQuery, useCreateWriteOffMutation } = writeOffApi;
