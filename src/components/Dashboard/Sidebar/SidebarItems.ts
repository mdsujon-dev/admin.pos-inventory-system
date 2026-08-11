import { ShieldCheck, Wallet } from "lucide-react";
import {
  ActionLogsIcon,
  DashboardIcon,
  MediaIcon,
  SettingsIcon,
} from "../../../Icons/Index";
import { RouteItem } from "../../../types/sidebarType";

const sidebarMenuRoutes: RouteItem[] = [
  // Dashboard has no `module` on purpose — every logged-in user (regardless
  // of role / permissions) sees this entry, matching the public route at "/".
  {
    label: "Dashboard",
    address: "/",
    icon: DashboardIcon,
    section: "Main",
  },
  {
    label: "Media Library",
    icon: MediaIcon,
    address: "/media-library",
    module: "Media Library",
    section: "Main",
  },
  {
    label: "Employee Management",
    icon: ShieldCheck,
    section: "System",
    submenus: [
      {
        label: "Employees",
        address: "/employees",
        module: "Employees",
        exactMatch: true,
      },
      { label: "Roles", address: "/employees/roles", module: "Roles" },
      {
        label: "Designations",
        address: "/employees/designations",
        module: "Designations",
      },
    ],
  },
  {
    label: "Income & Expense",
    icon: Wallet,
    address: "/income-expense",
    module: "Income & Expense",
    section: "System",
  },
  {
    label: "Logs",
    icon: ActionLogsIcon,
    section: "System",
    submenus: [
      {
        label: "Action Logs",
        address: "/logs/actions",
        module: "Action Logs",
      },
      {
        label: "Error Logs",
        address: "/logs/errors",
        module: "Error Logs",
      },
    ],
  },
  {
    label: "Settings",
    icon: SettingsIcon,
    section: "System",
    submenus: [
      // Profile is available to every logged-in user (token-based) — no
      // permission module, so it's never filtered out of the sidebar.
      { label: "Profile", address: "/settings/profile" },
      {
        label: "Countries",
        address: "/settings/countries",
        module: "Countries",
      },
      // Temporarily hidden — feature not in use yet.
      // {
      //   label: "Notification Sounds",
      //   address: "/settings/notification-sounds",
      // },
      {
        label: "Media Bin",
        address: "/settings/media-bin",
        module: "Media Bin",
      },
    ],
  },
];

export default sidebarMenuRoutes;
