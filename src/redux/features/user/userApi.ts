import { baseApi } from "../../api/baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation({
      query: (userInfo) => {
        return {
          url: "user",
          method: "POST",
          body: userInfo,
        };
      },
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ["users"],
    }),
    myProfile: builder.query({
      query: () => {
        return {
          url: "user/me",
          method: "GET",
        };
      },
      providesTags: ["user_profile"],
    }),

    getAllUser: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.limit) queryParams.append("limit", params.limit.toString());
          if (params.search) queryParams.append("search", params.search);
        }
        return {
          url: `user?${queryParams.toString()}`,
          method: "GET",
        };
      },
      transformResponse: (response: { data: any[]; meta: any }) => ({
        result: response.data || [],
        meta: response.meta || {},
      }),
      providesTags: ["users"],
    }),
    updateUser: builder.mutation({
      query: ({ id, data }) => {
        return {
          url: `user/${id}`,
          method: "PATCH",
          body: data,
        };
      },
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ["users"],
    }),
    // No `updateUserRole` here: there is no PUT /user/update-role/:id on the
    // server, so the endpoint that used to sit at this spot could only ever
    // 404. A role is changed through `updateUser` (PATCH /user/:id) like any
    // other field on the account.
    toggleUserStatus: builder.mutation({
      query: (userId) => {
        return {
          url: `user/${userId}/status`,
          method: "PATCH",
        };
      },
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ["users"],
    }),
    deleteUser: builder.mutation({
      query: (userId) => {
        return {
          url: `user/${userId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["users"],
    }),
    changePassword: builder.mutation({
      query: ({ userId, newPassword }) => {
        return {
          url: `user/${userId}/password`,
          method: "PATCH",
          body: { newPassword },
        };
      },
      transformResponse: (response: { data: any }) => response.data,
    }),
    uploadProfileImage: builder.mutation({
      query: (file: File) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: "user/profile-image",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: { data: { url: string; user: any } }) =>
        response.data,
      invalidatesTags: ["user_profile", "users"],
    }),
  }),
});

export const {
  useCreateUserMutation,
  useMyProfileQuery,
  useGetAllUserQuery,
  // Fired on demand by the export button, which needs every matching row
  // rather than the page being shown.
  useLazyGetAllUserQuery,
  useToggleUserStatusMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useChangePasswordMutation,
  useUploadProfileImageMutation,
} = authApi;
