import { useMemo } from "react";
import { RouteItem, SubmenuItem } from "../types/sidebarType";
import { hasModuleAccess, isSuperAdmin } from "../utils/permission";
import { useMe } from "./useMe";

/**
 * Returns sidebar items the current user is allowed to see.
 *
 * SUPER_ADMIN sees everything; items with no `module` are utility items and
 * always show; a tagged item needs at least one action on that module. A parent
 * whose submenus all filtered out is dropped with them.
 */
export const useFilteredSidebar = (items: RouteItem[]): RouteItem[] => {
  const { me } = useMe();

  return useMemo(() => {
    if (isSuperAdmin(me?.role)) return items;

    const canSee = (m?: string) => !m || hasModuleAccess(me, m);

    const result: RouteItem[] = [];
    for (const route of items) {
      if (route.submenus && route.submenus.length > 0) {
        const visibleSubs: SubmenuItem[] = route.submenus.filter((s) =>
          canSee(s.module)
        );
        if (visibleSubs.length > 0) {
          result.push({ ...route, submenus: visibleSubs });
        }
      } else if (canSee(route.module)) {
        result.push(route);
      }
    }
    return result;
  }, [items, me]);
};

export default useFilteredSidebar;
