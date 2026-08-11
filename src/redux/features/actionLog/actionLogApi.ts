import { baseApi } from "../../api/baseApi";

const actionLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    actionLogs: builder.query({
      query: (args) => {
        const params = new URLSearchParams();
        if (args) {
          args.forEach((item: { name: string; value: any }) => {
            params.append(item?.name, item?.value);
          });
        }
        return {
          url: "/action-logs",
          method: "GET",
          params,
        };
      },
    }),
  }),
});

// The lazy variant is fired on demand by the export button, which needs every
// matching row rather than the page being shown.
export const { useActionLogsQuery, useLazyActionLogsQuery } = actionLogApi;
