import { matchPath } from "react-router-dom";

export interface RoutePermission {
  /** Permission module name — must match an entry in PERMISSION_MODULES / sidebar */
  module: string;
  /** Required action on that module (case-insensitive comparison at runtime) */
  action: string;
  /**
   * Optional alternative `{module, action}` pairs. Access is granted when the
   * user satisfies the primary `{module, action}` OR any of these. Use for
   * routes that should accept either of several actions (e.g. a credentials
   * list page reachable by both "View" and "View Your").
   */
  anyOf?: { module: string; action: string }[];
}

/**
 * Maps admin URL paths → { module, action } the user must have to enter the page.
 *
 * - Routes not listed here are unguarded (only need login).
 * - SUPER_ADMIN bypasses every entry in this map.
 * - Patterns use react-router `:param` syntax and are matched via `matchPath`.
 *
 * Keep these in sync with `PERMISSION_MODULES` and the sidebar entries.
 */
export const routePermissions: Record<string, RoutePermission> = {
  // Dashboard
  // "/": { module: "Dashboard", action: "View" },

  // Media Library
  "/media-library": { module: "Media Library", action: "View" },

  // Income & Expense
  "/accounts/income-expense": { module: "Income & Expense", action: "View" },

  // Inventory
  "/inventory/products": { module: "Products", action: "View" },
  // Creating is its own action — a view-only user who types the URL should not
  // land on the form just because the list is open to them.
  "/inventory/products/create": { module: "Products", action: "Create" },
  "/inventory/products/edit/:id": { module: "Products", action: "Update" },
  "/inventory/products/expired": { module: "Expired Products", action: "View" },
  "/inventory/products/low-stock": { module: "Low Stocks", action: "View" },
  "/inventory/categories": { module: "Categories", action: "View" },
  "/inventory/sub-categories": { module: "Sub Categories", action: "View" },
  "/inventory/brands": { module: "Brands", action: "View" },
  "/inventory/units": { module: "Units", action: "View" },
  "/inventory/variant-attributes": {
    module: "Variant Attributes",
    action: "View",
  },
  "/inventory/print-labels": { module: "Print Labels", action: "View" },
  "/inventory/write-offs": { module: "Stock Write-offs", action: "View" },
  "/inventory/stock-lots": { module: "Stock Batches", action: "View" },
  // The old split screens. Kept so a bookmark still lands somewhere it is
  // allowed to be; both now redirect to Print Labels.
  "/inventory/print-barcode": { module: "Print Labels", action: "View" },
  "/inventory/print-qr-code": { module: "Print Labels", action: "View" },

  // Selling. The till is gated on Create, not View: standing at a counter
  // means ringing sales up, and a cashier who may only look at invoices has
  // no business on that screen.
  "/sales/pos": { module: "Sales", action: "Create" },
  "/sales/invoices": { module: "Sales", action: "View" },
  "/sales/invoices/:id": { module: "Sales", action: "View" },
  "/accounts/receivables": { module: "Accounts", action: "View" },

  // Customers and the relationship around them
  "/customers": { module: "Customers", action: "View" },
  "/customers/:id": { module: "Customers", action: "View" },
  "/customers/follow-ups": { module: "CRM", action: "View" },
  "/customers/dormant": { module: "CRM", action: "View" },

  // Buying
  "/vendors": { module: "Vendors", action: "View" },
  "/vendors/new": { module: "Vendors", action: "Create" },
  "/vendors/:id/edit": { module: "Vendors", action: "Update" },
  "/vendors/:id": { module: "Vendors", action: "View" },
  "/accounts/ledger": { module: "Accounts", action: "View" },
  "/sales/returns": { module: "Sales Returns", action: "View" },
  "/purchases": { module: "Purchases", action: "View" },
  "/purchases/new": { module: "Purchases", action: "Create" },
  "/accounts/payables": { module: "Accounts", action: "View" },
  "/accounts/vendor-payments": { module: "Vendor Payments", action: "View" },
  "/purchases/returns": { module: "Purchase Returns", action: "View" },
  "/purchases/refunds": { module: "Purchase Returns", action: "View" },
  "/purchases/:id/edit": { module: "Purchases", action: "Update" },
  "/purchases/:id": { module: "Purchases", action: "View" },

  // The books
  "/accounts": { module: "Accounts", action: "View" },
  "/accounts/profit-loss": { module: "Accounts", action: "View" },
  "/accounts/stock-valuation": { module: "Accounts", action: "View" },
  "/accounts/cash-flow": { module: "Accounts", action: "View" },
  "/accounts/expense-categories": { module: "Accounts", action: "View" },
  "/accounts/staff-performance": { module: "CRM", action: "View" },

  // Employee Management
  "/employees": { module: "Employees", action: "View" },
  "/employees/roles": { module: "Roles", action: "View" },
  // Granting rights is its own action, not a side effect of being able to see
  // the list of roles.
  "/employees/roles/:id/permissions": { module: "Roles", action: "Permission" },
  "/employees/designations": { module: "Designations", action: "View" },
  // Legacy /users/* paths
  "/users": { module: "Employees", action: "View" },
  "/users/roles": { module: "Roles", action: "View" },
  "/users/designations": { module: "Designations", action: "View" },

  // Logs
  "/logs/actions": { module: "Action Logs", action: "View" },
  "/logs/errors": { module: "Error Logs", action: "View" },
  // Legacy path
  "/action-logs": { module: "Action Logs", action: "View" },

  // Notifications (alt path)
  "/notifications": { module: "Notifications", action: "View" },

  // Settings
  // /settings/profile — intentionally unguarded: every logged-in user can view
  // and edit their own profile, so it needs no permission module.
  // Renders a screen that is already guarded under `/employees/designations`,
  // so without an entry here Settings was a way in past the gate on the front
  // door. A permission that one URL enforces and another does not is not a
  // permission.
  "/settings/designation": { module: "Designations", action: "View" },

  "/settings/payment-providers": { module: "Payment Providers", action: "View" },
  "/settings/media-bin": { module: "Media Bin", action: "View" },
  // /settings/notification-sounds — intentionally unguarded: it edits a
  // browser-local preference, no backend involvement, so any logged-in user
  // can manage their own sound.
};

/**
 * Look up the permission requirement for a given pathname. Tries exact match
 * first, then falls back to pattern matching (e.g. `/blogs/edit/:slug`).
 * Returns `undefined` for routes that don't require permission gating.
 */
export const getRoutePermission = (
  pathname: string
): RoutePermission | undefined => {
  if (routePermissions[pathname]) return routePermissions[pathname];

  for (const pattern of Object.keys(routePermissions)) {
    if (pattern === pathname) continue; // already handled above
    if (matchPath({ path: pattern, end: true }, pathname)) {
      return routePermissions[pattern];
    }
  }
  return undefined;
};
