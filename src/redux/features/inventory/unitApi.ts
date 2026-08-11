import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export interface IUnit {
  _id: string;
  name: string;
  shortName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const unitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnits: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/units",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["units"],
    }),

    getUnitById: builder.query({
      query: (id: string) => ({
        url: `/units/${id}`,
        method: "GET",
      }),
      providesTags: ["units"],
    }),

    createUnit: builder.mutation({
      query: (data: Partial<IUnit>) => ({
        url: "/units",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["units"],
    }),

    updateUnit: builder.mutation({
      query: ({ id, data }: { id: string; data: Partial<IUnit> }) => ({
        url: `/units/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["units"],
    }),

    toggleUnitStatus: builder.mutation({
      query: (id: string) => ({
        url: `/units/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["units"],
    }),

    deleteUnit: builder.mutation({
      query: (id: string) => ({
        url: `/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["units"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUnitsQuery,
  useLazyGetUnitsQuery,
  useGetUnitByIdQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useToggleUnitStatusMutation,
  useDeleteUnitMutation,
} = unitApi;
