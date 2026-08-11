import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export interface IBrand {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const brandApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/brands",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["brands"],
    }),

    getBrandById: builder.query({
      query: (id: string) => ({
        url: `/brands/${id}`,
        method: "GET",
      }),
      providesTags: ["brands"],
    }),

    createBrand: builder.mutation({
      query: (data: Partial<IBrand>) => ({
        url: "/brands",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["brands"],
    }),

    updateBrand: builder.mutation({
      query: ({ id, data }: { id: string; data: Partial<IBrand> }) => ({
        url: `/brands/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["brands"],
    }),

    toggleBrandStatus: builder.mutation({
      query: (id: string) => ({
        url: `/brands/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["brands"],
    }),

    deleteBrand: builder.mutation({
      query: (id: string) => ({
        url: `/brands/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["brands"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBrandsQuery,
  useLazyGetBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useToggleBrandStatusMutation,
  useDeleteBrandMutation,
} = brandApi;
