import { PermissionRequirement } from "../utils/permission";

/**
 * The permission behind every button, named once.
 *
 * Before this, each screen spelled its own gate inline —
 * `<PermissionGate module="Employees" action="Create">` — and the same button on
 * two screens could disagree, or quietly stop gating at all when a module was
 * renamed and one call site was missed. Naming the action instead means the
 * answer to "what does Add Employee need?" lives in one line, and
 * `<ActionButton action="employees.create">` cannot drift from it.
 *
 * Use with `useCanAction` or `<ActionButton>`; a name missing from this map is
 * treated as denied rather than allowed, so a typo hides a button instead of
 * opening it.
 */
export type ActionKey =
  | "employees.view"
  | "employees.create"
  | "employees.update"
  | "employees.delete"
  | "employees.changePassword"
  | "roles.view"
  | "roles.create"
  | "roles.update"
  | "roles.delete"
  | "roles.permission"
  | "designations.view"
  | "designations.create"
  | "designations.update"
  | "designations.delete"
  | "media.view"
  | "media.upload"
  | "media.delete"
  | "finance.view"
  | "finance.create"
  | "finance.update";

export const ACTION_PERMISSIONS: Record<ActionKey, PermissionRequirement> = {
  "employees.view": { module: "Employees", action: "View" },
  "employees.create": { module: "Employees", action: "Create" },
  "employees.update": { module: "Employees", action: "Update" },
  "employees.delete": { module: "Employees", action: "Delete" },
  "employees.changePassword": {
    module: "Employees",
    action: "Change Password",
  },

  "roles.view": { module: "Roles", action: "View" },
  "roles.create": { module: "Roles", action: "Create" },
  "roles.update": { module: "Roles", action: "Update" },
  "roles.delete": { module: "Roles", action: "Delete" },
  "roles.permission": { module: "Roles", action: "Update" },

  "designations.view": { module: "Designations", action: "View" },
  "designations.create": { module: "Designations", action: "Create" },
  "designations.update": { module: "Designations", action: "Update" },
  "designations.delete": { module: "Designations", action: "Delete" },

  "media.view": { module: "Media Library", action: "View" },
  "media.upload": { module: "Media Library", action: "Create" },
  "media.delete": { module: "Media Library", action: "Delete" },

  "finance.view": { module: "Income & Expense", action: "View" },
  "finance.create": { module: "Income & Expense", action: "Create" },
  "finance.update": { module: "Income & Expense", action: "Update" },
};

/** The `{module, action}` behind a named button, or `undefined` if unknown. */
export const requirementFor = (
  action: ActionKey
): PermissionRequirement | undefined => ACTION_PERMISSIONS[action];
