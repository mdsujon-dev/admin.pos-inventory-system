import { baseApi } from "../../api/baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (userInfo) => ({
        url: "/auth/login",
        method: "POST",
        body: userInfo,
      }),
    }),
    forgotPassword: builder.mutation<
      { success: boolean; message: string },
      { email: string }
    >({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<
      { success: boolean; message: string },
      { email: string; code: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
    // Change your OWN password (verifies the old one, returns fresh tokens).
    changeOwnPassword: builder.mutation<
      {
        success: boolean;
        message: string;
        data: { token: string; refreshToken: string };
      },
      // `oldPassword` is optional: an account still on the password it was
      // issued with may replace it without typing that one back. Every other
      // account must send it, and the server enforces that.
      { oldPassword?: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangeOwnPasswordMutation,
} = authApi;
