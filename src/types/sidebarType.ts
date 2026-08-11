export interface SubmenuItem {
  label: string;
  address: string;
  /** Permission module name. Item is hidden unless user has any access. */
  module?: string;
  /** If true, the NavLink will use the 'end' prop to match exactly. Useful when the address is a prefix of sibling addresses. */
  exactMatch?: boolean;
}

export interface RouteItem {
  icon: React.ElementType;
  label: string;
  address?: string;
  /** Permission module name. Item is hidden unless user has any access. */
  module?: string;
  /** Sidebar section this item belongs to (renders as a group header). */
  section?: string;
  submenus?: SubmenuItem[];
}
