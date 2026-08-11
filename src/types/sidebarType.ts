export interface SubmenuItem {
  label: string;
  address: string;
  /** Optional icon. Items without one fall back to the plain dot marker. */
  icon?: React.ElementType;
  /** Permission module name. Item is hidden unless user has any access. */
  module?: string;
  /**
   * Narrows the visibility check to a single action on `module` instead of
   * "any action". Use for items that are one operation rather than a screen —
   * e.g. Create Product needs Products:Create, not merely Products:View.
   */
  action?: string;
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
