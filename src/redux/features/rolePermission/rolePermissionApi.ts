import { baseApi } from "../../api/baseApi";

export const rolePermissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllRolePermissions: builder.query({
      query: () => ({
        url: "/role-permissions",
        method: "GET",
      }),
      providesTags: ["role-permissions"],
    }),

    getRolePermissionsByRoleId: builder.query({
      query: (roleId: string) => ({
        url: `/role-permissions/role/${roleId}`,
        method: "GET",
      }),
      providesTags: ["role-permissions"],
    }),

    createRolePermission: builder.mutation({
      query: (data: { roleId: string; module: string; permissions: string[] }) => ({
        url: "/role-permissions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["role-permissions"],
    }),

    updateRolePermission: builder.mutation({
      query: ({
        id,
        data,
      }: {
        id: string;
        data: { roleId?: string; module?: string; permissions?: string[] };
      }) => ({
        url: `/role-permissions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["role-permissions"],
    }),

    deleteRolePermission: builder.mutation({
      query: (id: string) => ({
        url: `/role-permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["role-permissions"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllRolePermissionsQuery,
  useGetRolePermissionsByRoleIdQuery,
  useCreateRolePermissionMutation,
  useUpdateRolePermissionMutation,
  useDeleteRolePermissionMutation,
} = rolePermissionApi;
