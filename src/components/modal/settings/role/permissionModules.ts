/**
 * Permission catalog — mirrors the admin sidebar so the modules a role
 * can be granted access to match what's actually visible in the panel.
 * Edit this file to add / remove modules or actions; no backend admin
 * page involved.
 *
 * Module name MUST match what the backend `checkPermission(module, action)`
 * middleware passes. Pick a casing convention and stick to it.
 *
 * `group` mirrors the sidebar sections so the permission modal can render the
 * modules grouped part-by-part instead of one long flat list.
 */
export interface PermissionModule {
  module: string;
  permissions: string[];
  group: string;
}

const CRUD = ["View", "Create", "Update", "Delete"];

// Section order for the permission modal — matches the sidebar top-to-bottom.
export const PERMISSION_GROUP_ORDER: string[] = [
  "Dashboard",
  "Media Library",
  "Inventory",
  "Employee Management",
  "Accounts",
  "Logs",
  "Settings",
];

// Dashboard widgets — each card is view-gated. A user with none of these sees
// the welcome screen instead of the dashboard.
//
// Deliberately not "Employees": that module already exists under Employee
// Management with full CRUD, and listing it twice would put the same module in
// the permission sheet in two places with two different action sets.
export const DASHBOARD_CARD_MODULES = [
  "Income",
  "Expenses",
  "Net Profit",
  "Income vs Expenses",
] as const;

export const PERMISSION_MODULES: PermissionModule[] = [
  // Dashboard cards (view-only)
  ...DASHBOARD_CARD_MODULES.map((module) => ({
    module,
    permissions: ["View"],
    group: "Dashboard",
  })),

  // Accounts — daily income & expense (add + edit only, no delete)
  {
    module: "Income & Expense",
    permissions: ["View", "Create", "Update"],
    group: "Accounts",
  },

  // Media Library
  {
    module: "Media Library",
    permissions: ["View", "Create", "Delete"],
    group: "Media Library",
  },

  // Inventory — mirrors the Product group in the sidebar, one module per
  // screen. The two print screens produce labels rather than records, so they
  // get View + Print instead of CRUD.
  { module: "Products", permissions: CRUD, group: "Inventory" },
  { module: "Expired Products", permissions: ["View"], group: "Inventory" },
  { module: "Low Stocks", permissions: ["View"], group: "Inventory" },
  { module: "Categories", permissions: CRUD, group: "Inventory" },
  { module: "Sub Categories", permissions: CRUD, group: "Inventory" },
  { module: "Brands", permissions: CRUD, group: "Inventory" },
  { module: "Units", permissions: CRUD, group: "Inventory" },
  { module: "Variant Attributes", permissions: CRUD, group: "Inventory" },
  { module: "Warranties", permissions: CRUD, group: "Inventory" },
  {
    module: "Print Barcode",
    permissions: ["View", "Print"],
    group: "Inventory",
  },
  {
    module: "Print QR Code",
    permissions: ["View", "Print"],
    group: "Inventory",
  },

  // Employee Management
  {
    module: "Employees",
    permissions: [...CRUD, "Change Password"],
    group: "Employee Management",
  },
  {
    module: "Roles",
    permissions: [...CRUD, "Permission"],
    group: "Employee Management",
  },
  { module: "Designations", permissions: CRUD, group: "Employee Management" },

  // Logs
  { module: "Action Logs", permissions: ["View", "Delete"], group: "Logs" },
  { module: "Error Logs", permissions: ["View", "Delete"], group: "Logs" },

  // Settings
  { module: "Countries", permissions: CRUD, group: "Settings" },
  {
    module: "Media Bin",
    permissions: ["View", "Restore", "Delete"],
    group: "Settings",
  },
  { module: "Notifications", permissions: ["View", "Delete"], group: "Settings" },
];

/**
 * All distinct action strings across modules — used to build the
 * "Quick Grant" buttons dynamically without hardcoding them twice.
 */
export const DISTINCT_PERMISSION_ACTIONS: string[] = Array.from(
  new Set(PERMISSION_MODULES.flatMap((m) => m.permissions))
);

export const TOTAL_PERMISSION_COUNT: number = PERMISSION_MODULES.reduce(
  (sum, m) => sum + m.permissions.length,
  0
);
