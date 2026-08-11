import { baseApi } from "../../api/baseApi";

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all permissions
    getPermissions: builder.query({
      query: () => ({
        url: "/permissions",
        method: "GET",
      }),
      providesTags: ["permissions"],
    }),

    // Get single permission by ID
    getPermissionById: builder.query({
      query: (id: string) => ({
        url: `/permissions/${id}`,
        method: "GET",
      }),
      providesTags: ["permissions"],
    }),

    // Create permission
    createPermission: builder.mutation({
      query: (data: { module: string; description?: string; actions: string[] }) => ({
        url: "/permissions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["permissions"],
    }),

    // Update permission
    updatePermission: builder.mutation({
      query: ({ id, data }: { id: string; data: { module?: string; description?: string; actions?: string[] } }) => ({
        url: `/permissions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["permissions"],
    }),

    // Delete permission
    deletePermission: builder.mutation({
      query: (id: string) => ({
        url: `/permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["permissions"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = permissionsApi;

