import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export type WarrantyPeriod = "Days" | "Weeks" | "Months" | "Years";

export const WARRANTY_PERIODS: WarrantyPeriod[] = [
  "Days",
  "Weeks",
  "Months",
  "Years",
];

export interface IWarranty {
  _id: string;
  name: string;
  duration: number;
  period: WarrantyPeriod;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const warrantyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarranties: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/warranties",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["warranties"],
    }),

    getWarrantyById: builder.query({
      query: (id: string) => ({
        url: `/warranties/${id}`,
        method: "GET",
      }),
      providesTags: ["warranties"],
    }),

    createWarranty: builder.mutation({
      query: (data: Partial<IWarranty>) => ({
        url: "/warranties",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["warranties"],
    }),

    updateWarranty: builder.mutation({
      query: ({ id, data }: { id: string; data: Partial<IWarranty> }) => ({
        url: `/warranties/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["warranties"],
    }),

    toggleWarrantyStatus: builder.mutation({
      query: (id: string) => ({
        url: `/warranties/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["warranties"],
    }),

    deleteWarranty: builder.mutation({
      query: (id: string) => ({
        url: `/warranties/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["warranties"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWarrantiesQuery,
  useLazyGetWarrantiesQuery,
  useGetWarrantyByIdQuery,
  useCreateWarrantyMutation,
  useUpdateWarrantyMutation,
  useToggleWarrantyStatusMutation,
  useDeleteWarrantyMutation,
} = warrantyApi;
