import { baseApi } from "../../api/baseApi";
import { buildQueryParams, QueryArg } from "../../api/queryArgs";
import { ICategory } from "./categoryApi";

export interface ISubCategory {
  _id: string;
  name: string;
  slug: string;
  /** Populated by the API on list/detail reads; sent as an id on write. */
  category: Pick<ICategory, "_id" | "name" | "slug"> | string;
  image?: string | null;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Narrows the populated-or-id union at the call site that needs the label. */
export const categoryOf = (subCategory: ISubCategory) =>
  typeof subCategory.category === "string" ? null : subCategory.category;

const subCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubCategories: builder.query({
      query: (args: QueryArg[] | undefined) => ({
        url: "/sub-categories",
        method: "GET",
        params: buildQueryParams(args),
      }),
      providesTags: ["sub-categories"],
    }),

    getSubCategoryById: builder.query({
      query: (id: string) => ({
        url: `/sub-categories/${id}`,
        method: "GET",
      }),
      providesTags: ["sub-categories"],
    }),

    createSubCategory: builder.mutation({
      query: (data: Record<string, unknown>) => ({
        url: "/sub-categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["sub-categories"],
    }),

    updateSubCategory: builder.mutation({
      query: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        url: `/sub-categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["sub-categories"],
    }),

    toggleSubCategoryStatus: builder.mutation({
      query: (id: string) => ({
        url: `/sub-categories/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["sub-categories"],
    }),

    deleteSubCategory: builder.mutation({
      query: (id: string) => ({
        url: `/sub-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["sub-categories"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSubCategoriesQuery,
  useLazyGetSubCategoriesQuery,
  useGetSubCategoryByIdQuery,
  useCreateSubCategoryMutation,
  useUpdateSubCategoryMutation,
  useToggleSubCategoryStatusMutation,
  useDeleteSubCategoryMutation,
} = subCategoryApi;
