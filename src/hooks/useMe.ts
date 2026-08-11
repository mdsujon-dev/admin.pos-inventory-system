import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/features/auth/authSlice";
import { useMyProfileQuery } from "../redux/features/user/userApi";

// Module-level guard so that — even though useMe is called from many
// components at once — the reload fires only once.
let permissionReloadTriggered = false;

/**
 * Fetches the currently authenticated user via /user/me and returns
 * a flattened result. Falls back to the cached Redux auth user while
 * the request is in flight or if the API call fails.
 *
 * Polls in the background so a permission change made by an admin is picked
 * up within ~a minute: when the server flags `hasPermissionChange`, the next
 * /me read returns it (and resets it), and we reload so the whole app
 * re-initializes with the new access.
 */
export const useMe = () => {
  const cachedUser = useSelector(selectCurrentUser) as any;

  const { data, isLoading, isFetching, error, refetch } = useMyProfileQuery(
    undefined,
    {
      pollingInterval: 60000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const me = data?.data ?? cachedUser ?? null;

  useEffect(() => {
    if (me?.hasPermissionChange && !permissionReloadTriggered) {
      // The flag is consumed server-side on this read, so the reload won't
      // loop. A full reload re-fetches permissions and rebuilds the sidebar.
      permissionReloadTriggered = true;
      window.location.reload();
    }
  }, [me?.hasPermissionChange]);

  return {
    me,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

export default useMe;
