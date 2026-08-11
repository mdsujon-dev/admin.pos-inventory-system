import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { HOME_ROUTE } from "../access";
import { Loading } from "../components/shared/Loading";
import {
  selectCurrentUser,
  setProfile,
  setRole,
} from "../redux/features/auth/authSlice";
import { useMyProfileQuery } from "../redux/features/user/userApi";
import { hasPermission, isSuperAdmin } from "../utils/permission";
import { getRoutePermission } from "./routePermissions";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch();
  const user: any = useSelector(selectCurrentUser);
  const location = useLocation();

  const { data: meData, isLoading: meLoading } = useMyProfileQuery(undefined, {
    skip: !user,
  });

  const requiredPermission = useMemo(
    () => getRoutePermission(location.pathname),
    [location.pathname]
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (meLoading) {
    return <Loading />;
  }

  const profile = meData?.data;

  if (profile?.profilePhoto) {
    dispatch(setProfile(profile.profilePhoto));
  }
  if (profile?.role) {
    dispatch(setRole(profile.role));
  }

  const principal = {
    role: profile?.role ?? user?.role,
    permissions: profile?.permissions,
  };

  // Permission gate — single source of truth lives in utils/permission.ts.
  // SUPER_ADMIN bypass is handled there.
  if (requiredPermission) {
    const ok =
      hasPermission(
        principal,
        requiredPermission.module,
        requiredPermission.action
      ) ||
      (requiredPermission.anyOf ?? []).some((p) =>
        hasPermission(principal, p.module, p.action)
      );
    if (!ok) {
      /**
       * Home, not /404.
       *
       * A 404 says "this page does not exist", and for these people it plainly
       * does — a colleague sent them the link, or it was in the menu before
       * their role changed. Telling them the address is wrong sends them to the
       * office to report a broken system. Their own dashboard, which is where
       * the answer to "what may I do here" actually lives, says the true thing
       * instead: this is not yours, here is what is.
       */
      return (
        <Navigate
          to={HOME_ROUTE}
          replace
          state={{ deniedPath: location.pathname }}
        />
      );
    }
  }

  if (user?.email) {
    return <>{children}</>;
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
