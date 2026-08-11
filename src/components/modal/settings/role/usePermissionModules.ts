import { useMemo } from "react";
import { PermissionModule, PERMISSION_MODULES } from "./permissionModules";

interface PermissionCatalog {
  modules: PermissionModule[];
  totalCount: number;
  distinctActions: string[];
}

/**
 * The permission catalog the role sheet is drawn from.
 *
 * A hook rather than a plain export because the list used to be extended at
 * runtime — one module's actions came from a collection — and will be again
 * once the POS grows a module whose permissions are data. Keeping the call
 * shape means that change stays inside this file.
 */
export function usePermissionModules(): PermissionCatalog {
  return useMemo(() => {
    const modules: PermissionModule[] = PERMISSION_MODULES;

    const totalCount = modules.reduce((sum, m) => sum + m.permissions.length, 0);
    const distinctActions = Array.from(
      new Set(modules.flatMap((m) => m.permissions))
    );

    return { modules, totalCount, distinctActions };
  }, []);
}
