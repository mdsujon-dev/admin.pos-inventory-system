import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { toast } from "react-toastify";
import { config } from "../../config";
import { logout, setUser } from "../features/auth/authSlice";
import { RootState } from "../features/store";

// Lead IP is only logging metadata, so it must NEVER block API requests.
// We fetch it once in the background (with a short timeout) and cache it; every
// request reads the cached value synchronously. Previously each request awaited
// api.ipify.org in prepareHeaders, which stalled ALL data loading when that
// external service was slow/blocked (observed 40s+).
let cachedIp = "Unknown";
let ipFetchStarted = false;

const primeLeadIP = (): void => {
  if (ipFetchStarted) return;
  ipFetchStarted = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  fetch("https://api.ipify.org?format=json", { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => {
      if (data?.ip) cachedIp = data.ip;
    })
    .catch(() => {
      /* keep "Unknown" — never block on this */
    })
    .finally(() => clearTimeout(timer));
};

// Construct Lead Metadata (synchronous — uses the cached IP).
const getLeadDetails = () => {
  primeLeadIP(); // fire-and-forget, runs at most once
  return {
    ipAddress: cachedIp,
    userAgent: navigator.userAgent || "Unknown",
    browserUrl: window.location.href,
    accessedAt: new Date().toISOString(),
  };
};

const baseQuery = fetchBaseQuery({
  baseUrl: config.api_url,
  credentials: "include",
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const leadDetails = getLeadDetails();
    headers.set("X-Lead-Details", JSON.stringify(leadDetails));
    headers.set("X-Action", endpoint);

    return headers;
  },
});

/**
 * Single-flight refresh: if 5 requests get 401 at once, only ONE refresh
 * request hits the server. The other 4 await the same promise.
 */
let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (api: any): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${config.api_url}/auth/refresh-token`, {
        method: "POST",
        credentials: "include", // send the httpOnly refresh-token cookie
      });
      if (!res.ok) return null;
      const json = await res.json();
      const newToken: string | undefined =
        json?.data?.accessToken || json?.data?.token;
      if (!newToken) return null;

      // Persist the new access token. Keep the cached user so the UI
      // doesn't blank while RTK Query retries.
      const currentUser = (api.getState() as RootState).auth.user;
      api.dispatch(setUser({ user: currentUser as any, token: newToken }));
      localStorage.setItem("token", newToken);

      return newToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const baseQueryWithRefreshToken: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Try to refresh once on 401 — never on the refresh endpoint itself.
  const isRefreshCall =
    typeof args === "object" &&
    typeof (args as FetchArgs).url === "string" &&
    (args as FetchArgs).url.includes("/auth/refresh-token");

  if (result?.error?.status === 401 && !isRefreshCall) {
    const newToken = await performRefresh(api);

    if (newToken) {
      result = await baseQuery(args, api, extraOptions);
    }

    if (!newToken || result?.error?.status === 401) {
      toast.error(
        (result?.error?.data as any)?.message ||
          "Session expired. Please log in again."
      );
      api.dispatch(logout());
      localStorage.removeItem("token");
      window.location.href = "/login";
      return result;
    }
  }

  if (result?.error?.status === 404) {
    toast.error((result?.error?.data as any)?.message || "Not found.");
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithRefreshToken,
  tagTypes: [
    "users",
    "user_profile",
    "roles",
    "role-permissions",
    "permissions",
    "designations",
    "transactions",
    "media-library",
    "media-library-bin",
    "folders",
    "notifications",

    "error-logs",
    // Inventory
    "categories",
    "sub-categories",
    "brands",
    "units",
    "variant-attributes",
    "products",
    // Buying
    "paymentProviders",
    "vendors",
    "vendor-payments",
    "purchases",
    "stock-lots",
    // Selling
    "sales",
    "sale-returns",
    "customers",
    // The books and the customer relationship
    "expense-categories",
    "reports",
    "crm",
  ],
  endpoints: () => ({}),
});
