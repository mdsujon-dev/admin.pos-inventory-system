import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export interface IVariantAttribute {
  _id: string;
  name: string;
  values: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const variantAttributeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVariantAttributes: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/variant-attributes",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["variant-attributes"],
    }),

    getVariantAttributeById: builder.query({
      query: (id: string) => ({
        url: `/variant-attributes/${id}`,
        method: "GET",
      }),
      providesTags: ["variant-attributes"],
    }),

    createVariantAttribute: builder.mutation({
      query: (data: Partial<IVariantAttribute>) => ({
        url: "/variant-attributes",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["variant-attributes"],
    }),

    updateVariantAttribute: builder.mutation({
      query: ({
        id,
        data,
      }: {
        id: string;
        data: Partial<IVariantAttribute>;
      }) => ({
        url: `/variant-attributes/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["variant-attributes"],
    }),

    toggleVariantAttributeStatus: builder.mutation({
      query: (id: string) => ({
        url: `/variant-attributes/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["variant-attributes"],
    }),

    deleteVariantAttribute: builder.mutation({
      query: (id: string) => ({
        url: `/variant-attributes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["variant-attributes"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVariantAttributesQuery,
  useLazyGetVariantAttributesQuery,
  useGetVariantAttributeByIdQuery,
  useCreateVariantAttributeMutation,
  useUpdateVariantAttributeMutation,
  useToggleVariantAttributeStatusMutation,
  useDeleteVariantAttributeMutation,
} = variantAttributeApi;
