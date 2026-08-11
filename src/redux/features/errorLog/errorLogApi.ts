import { baseApi } from "../../api/baseApi";

const errorLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    errorLogs: builder.query({
      query: (args?: { name: string; value: any }[]) => {
        const params = new URLSearchParams();
        if (args) {
          args.forEach((item) => {
            if (item?.value !== undefined && item?.value !== "") {
              params.append(item.name, String(item.value));
            }
          });
        }
        return {
          url: "/error-logs",
          method: "GET",
          params,
        };
      },
      providesTags: ["error-logs"],
    }),

    deleteErrorLog: builder.mutation({
      query: (id: string) => ({
        url: `/error-logs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["error-logs"],
    }),

    clearAllErrorLogs: builder.mutation({
      query: () => ({
        url: "/error-logs/clear-all",
        method: "DELETE",
      }),
      invalidatesTags: ["error-logs"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useErrorLogsQuery,
  // Fired on demand by the export button, which needs every matching row
  // rather than the page being shown.
  useLazyErrorLogsQuery,
  useDeleteErrorLogMutation,
  useClearAllErrorLogsMutation,
} = errorLogApi;
