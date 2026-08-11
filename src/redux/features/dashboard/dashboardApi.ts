import { baseApi } from "../../api/baseApi";

/**
 * A headline number on the dashboard grid.
 *
 * `key` is a plain string rather than a union: the tiles a POS wants — today's
 * sales, stock on hand, low-stock lines — are not built yet, and naming them
 * here before the modules exist would only date the file.
 */
export interface DashboardStat {
  key: string;
  title: string;
  value: number | string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface DashboardOverview {
  stats: DashboardStat[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dashboardOverview: builder.query<DashboardOverview, void>({
      query: () => ({ url: "/dashboard/overview", method: "GET" }),
      transformResponse: (response: ApiEnvelope<DashboardOverview>) =>
        response.data,
    }),
    dashboardStats: builder.query<DashboardStat[], void>({
      query: () => ({ url: "/dashboard/stats", method: "GET" }),
      transformResponse: (response: ApiEnvelope<DashboardStat[]>) =>
        response.data,
    }),
  }),
});

export const { useDashboardOverviewQuery, useDashboardStatsQuery } =
  dashboardApi;
