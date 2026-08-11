import {
  BadgeCheck,
  Barcode,
  Boxes,
  CalendarClock,
  LayoutGrid,
  Package,
  QrCode,
  Rows3,
  Ruler,
  ShieldCheck,
  Tags,
  TrendingDown,
  Wallet,
} from "lucide-react";
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
  // Inventory — everything that describes what is on the shelf. Catalog data
  // (categories, brands, units, variant attributes, warranties) lives under
  // Product rather than beside it: they exist only to define a product, so
  // splitting them into sibling groups would spread one subject over the
  // sidebar.
  {
    label: "Inventory Management",
    icon: Boxes,
    section: "Inventory",
    submenus: [
      {
        label: "Products",
        address: "/inventory/products",
        icon: Package,
        module: "Products",
        // "/inventory/products" is a prefix of every sibling below it, so
        // without this the parent stays highlighted on all of them.
        exactMatch: true,
      },
      // Create Product is deliberately not a sidebar entry — it is reached by
      // the "Add Product" button on the Products list, so listing it here
      // would be a second door to the same form.
      {
        label: "Expired Products",
        address: "/inventory/products/expired",
        icon: CalendarClock,
        module: "Expired Products",
      },
      {
        label: "Low Stocks",
        address: "/inventory/products/low-stock",
        icon: TrendingDown,
        module: "Low Stocks",
      },
      {
        label: "Category",
        address: "/inventory/categories",
        icon: LayoutGrid,
        module: "Categories",
      },
      {
        label: "Sub Category",
        address: "/inventory/sub-categories",
        icon: Rows3,
        module: "Sub Categories",
      },
      {
        label: "Brands",
        address: "/inventory/brands",
        icon: Tags,
        module: "Brands",
      },
      {
        label: "Units",
        address: "/inventory/units",
        icon: Ruler,
        module: "Units",
      },
      {
        label: "Warranties",
        address: "/inventory/warranties",
        icon: BadgeCheck,
        module: "Warranties",
      },
      {
        label: "Print Barcode",
        address: "/inventory/print-barcode",
        icon: Barcode,
        module: "Print Barcode",
      },
      {
        label: "Print QR Code",
        address: "/inventory/print-qr-code",
        icon: QrCode,
        module: "Print QR Code",
      },
    ],
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
