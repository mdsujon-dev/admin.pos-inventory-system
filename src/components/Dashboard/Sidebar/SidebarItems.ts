import {
  Banknote,
  Boxes,
  CalendarClock,
  ClipboardList,
  Contact,
  FileText,
  HeartHandshake,
  Landmark,
  LayoutGrid,
  Layers,
  Package,
  PhoneCall,
  PieChart,
  Receipt,
  Ruler,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  TrendingDown,
  UserRoundX,
  Users,
  Wallet,
  Warehouse,
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
  // (categories, brands, units, variant attributes) lives under
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
      // One entry, two tabs. A sub category has no meaning without its parent,
      // and filing one almost always means looking at the other.
      {
        label: "Category",
        address: "/inventory/categories",
        icon: LayoutGrid,
        module: "Categories",
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
      // One screen for both formats. Barcode and QR were two entries printing
      // the same rows off the same picker, differing only in which symbol they
      // drew — see the Print Labels page.
      {
        label: "Print Labels",
        address: "/inventory/print-labels",
        icon: ScanLine,
        module: "Print Labels",
      },
      {
        label: "Stock Batches",
        address: "/inventory/stock-lots",
        icon: Layers,
        module: "Stock Batches",
      },
    ],
  },

  // Selling. Its own section rather than a corner of Inventory: the till is
  // used all day by people who never touch the catalog.
  {
    label: "Point of Sale",
    address: "/sales/pos",
    icon: ScanLine,
    module: "Sales",
    section: "Sales",
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    section: "Sales",
    submenus: [
      {
        label: "Invoices",
        address: "/sales/invoices",
        icon: Receipt,
        module: "Sales",
        exactMatch: true,
      },
      {
        label: "Customer Dues",
        address: "/sales/receivables",
        icon: FileText,
        module: "Accounts",
      },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    section: "Sales",
    submenus: [
      {
        label: "All Customers",
        address: "/customers",
        icon: Contact,
        module: "Customers",
        exactMatch: true,
      },
      {
        label: "Follow-ups",
        address: "/customers/follow-ups",
        icon: PhoneCall,
        module: "CRM",
      },
      {
        label: "Dormant Customers",
        address: "/customers/dormant",
        icon: UserRoundX,
        module: "CRM",
      },
    ],
  },

  // Buying. Where every unit of stock comes from, and who is owed for it.
  {
    label: "Purchases",
    icon: Truck,
    section: "Purchasing",
    submenus: [
      {
        label: "New Purchase",
        address: "/purchases/new",
        icon: ClipboardList,
        module: "Purchases",
      },
      {
        label: "Purchase Bills",
        address: "/purchases",
        icon: Receipt,
        module: "Purchases",
        exactMatch: true,
      },
      {
        label: "Vendor Payments",
        address: "/purchases/payments",
        icon: Banknote,
        module: "Vendor Payments",
      },
      {
        label: "Vendor Dues",
        address: "/purchases/payables",
        icon: FileText,
        module: "Accounts",
      },
    ],
  },
  {
    label: "Vendors",
    address: "/vendors",
    icon: Warehouse,
    module: "Vendors",
    section: "Purchasing",
  },

  // The books.
  {
    label: "Accounts",
    icon: Landmark,
    section: "Accounts",
    submenus: [
      {
        label: "Overview",
        address: "/accounts",
        icon: PieChart,
        module: "Accounts",
        exactMatch: true,
      },
      {
        label: "Profit & Loss",
        address: "/accounts/profit-loss",
        icon: TrendingDown,
        module: "Accounts",
      },
      {
        label: "Stock Valuation",
        address: "/accounts/stock-valuation",
        icon: Warehouse,
        module: "Accounts",
      },
      {
        label: "Cash Flow",
        address: "/accounts/cash-flow",
        icon: Wallet,
        module: "Accounts",
      },
      {
        label: "Expense Categories",
        address: "/accounts/expense-categories",
        icon: LayoutGrid,
        module: "Accounts",
      },
    ],
  },
  {
    label: "Staff Performance",
    address: "/reports/employee-sales",
    icon: HeartHandshake,
    module: "CRM",
    section: "Accounts",
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
      {
        label: "Payment Providers",
        address: "/settings/payment-providers",
        module: "Payment Providers",
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
