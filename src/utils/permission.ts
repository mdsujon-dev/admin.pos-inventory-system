/**
 * Permission utilities — single source of truth for "can this user do X?".
 *
 * - Module / action comparison is case-insensitive on both sides.
 * - SUPER_ADMIN bypasses every check.
 * - All helpers accept a nullable user so they're safe before /me lands.
 *
 * Pair with `useHasPermission(module, action)` for hook usage, or
 * <PermissionGate module="..." action="..."> for declarative JSX.
 */

export interface UserPermission {
  module: string;
  actions: string[];
}

export interface PermissionUser {
  role?: string | null;
  permissions?: UserPermission[];
}

export interface PermissionRequirement {
  module: string;
  action: string;
}

export const isSuperAdmin = (role?: string | null): boolean =>
  String(role ?? "").toUpperCase() === "SUPER_ADMIN";

/** True if the user has the given action on the given module. */
export const hasPermission = (
  user: PermissionUser | null | undefined,
  module: string,
  action: string
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user.role)) return true;
  const want = String(action).toUpperCase();
  const entry = user.permissions?.find((p) => p?.module === module);
  if (!entry || !Array.isArray(entry.actions)) return false;
  return entry.actions.some((a) => String(a).toUpperCase() === want);
};

/** True if the user has ANY of the listed `{module, action}` pairs. */
export const hasAnyPermission = (
  user: PermissionUser | null | undefined,
  requirements: PermissionRequirement[]
): boolean => {
  if (!user || requirements.length === 0) return false;
  if (isSuperAdmin(user.role)) return true;
  return requirements.some((r) => hasPermission(user, r.module, r.action));
};

/** True if the user has ALL of the listed `{module, action}` pairs. */
export const hasAllPermissions = (
  user: PermissionUser | null | undefined,
  requirements: PermissionRequirement[]
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user.role)) return true;
  if (requirements.length === 0) return true;
  return requirements.every((r) => hasPermission(user, r.module, r.action));
};

/** True if the user has ANY action at all on the given module. */
export const hasModuleAccess = (
  user: PermissionUser | null | undefined,
  module: string
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user.role)) return true;
  const entry = user.permissions?.find((p) => p?.module === module);
  return Array.isArray(entry?.actions) && entry!.actions.length > 0;
};
