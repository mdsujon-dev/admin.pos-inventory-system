import { baseApi } from "../../api/baseApi";

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: (params?: {
        page?: number;
        limit?: number;
        searchTerm?: string;
      }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));
        if (params?.searchTerm)
          queryParams.append("searchTerm", params.searchTerm);
        const qs = queryParams.toString();
        return {
          url: qs ? `/roles?${qs}` : "/roles",
          method: "GET",
        };
      },
      transformResponse: (response: { data: any[]; meta: any }) => ({
        result: response.data || [],
        meta: response.meta || {},
      }),
      providesTags: ["roles"],
    }),

    getRoleById: builder.query({
      query: (id: string) => ({
        url: `/roles/${id}`,
        method: "GET",
      }),
      providesTags: ["roles"],
    }),

    createRole: builder.mutation({
      query: (data: { role: string; description?: string; isActive?: boolean }) => ({
        url: "/roles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["roles"],
    }),

    updateRole: builder.mutation({
      query: ({
        id,
        data,
      }: {
        id: string;
        data: { role?: string; description?: string; isActive?: boolean };
      }) => ({
        url: `/roles/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["roles"],
    }),

    toggleRoleStatus: builder.mutation({
      query: (id: string) => ({
        url: `/roles/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["roles"],
    }),

    deleteRole: builder.mutation({
      query: (id: string) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["roles"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useToggleRoleStatusMutation,
  useDeleteRoleMutation,
} = roleApi;
