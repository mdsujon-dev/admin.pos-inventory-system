import { useMe } from "./useMe";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasModuleAccess,
  hasPermission,
  isSuperAdmin,
  PermissionRequirement,
} from "../utils/permission";

/**
 * Returns true when the current user has `action` on `module`.
 *
 *     const canCreate = useHasPermission("Users", "Create");
 *     {canCreate && <Button>Add User</Button>}
 *
 * SUPER_ADMIN bypasses every check. Case-insensitive on both sides.
 */
export const useHasPermission = (module: string, action: string): boolean => {
  const { me } = useMe();
  return hasPermission(me, module, action);
};

/** Same as useHasPermission but accepts an array — passes if ANY match. */
export const useHasAnyPermission = (
  requirements: PermissionRequirement[]
): boolean => {
  const { me } = useMe();
  return hasAnyPermission(me, requirements);
};

/** Same as useHasPermission but accepts an array — passes only if ALL match. */
export const useHasAllPermissions = (
  requirements: PermissionRequirement[]
): boolean => {
  const { me } = useMe();
  return hasAllPermissions(me, requirements);
};

/** Returns true when the user has any action at all on the module. */
export const useHasModuleAccess = (module: string): boolean => {
  const { me } = useMe();
  return hasModuleAccess(me, module);
};

/** Returns true when the current user is SUPER_ADMIN. */
export const useIsSuperAdmin = (): boolean => {
  const { me } = useMe();
  return isSuperAdmin(me?.role);
};

export default useHasPermission;
