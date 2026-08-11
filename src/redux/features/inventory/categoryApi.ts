import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/categories",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["categories"],
    }),

    getCategoryById: builder.query({
      query: (id: string) => ({
        url: `/categories/${id}`,
        method: "GET",
      }),
      providesTags: ["categories"],
    }),

    createCategory: builder.mutation({
      query: (data: Partial<ICategory>) => ({
        url: "/categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["categories"],
    }),

    updateCategory: builder.mutation({
      query: ({ id, data }: { id: string; data: Partial<ICategory> }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["categories"],
    }),

    toggleCategoryStatus: builder.mutation({
      query: (id: string) => ({
        url: `/categories/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["categories"],
    }),

    deleteCategory: builder.mutation({
      query: (id: string) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      // Sub categories carry their parent's name in the table, so a rename or
      // deletion here has to refresh that list too.
      invalidatesTags: ["categories", "sub-categories"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useToggleCategoryStatusMutation,
  useDeleteCategoryMutation,
} = categoryApi;
