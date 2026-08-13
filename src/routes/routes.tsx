import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import ErrorPage from "../pages/ErrorPage/ErrorPage";
import ForgotPassword from "../pages/Login/ForgotPassword";
import Login from "../pages/Login/Login";
import ResetPassword from "../pages/Login/ResetPassword";

import AllActionLogs from "../pages/ActionLog/AllActionLogs";
import AllErrorLogs from "../pages/ActionLog/AllErrorLogs";
import IncomeExpense from "../pages/IncomeExpense/IncomeExpense.tsx";
import AllMediaLibraryList from "../pages/media-library/AllMediaLibraryList.tsx";
import AllNotifications from "../pages/Notifications/AllNotifications";
import Profile from "../pages/Profile/Profile";

import Designation from "../pages/Settings/Desgination/Designation.tsx";
import Providers from "../pages/Settings/Providers/Providers";
import MediaBin from "../pages/Settings/MediaBin/MediaBin.tsx";
import NotificationSounds from "../pages/Settings/NotificationSounds/NotificationSounds.tsx";
import Brands from "../pages/Inventory/Brands/Brands.tsx";
import CategoryTabs from "../pages/Inventory/Categories/CategoryTabs.tsx";
import PrintBarcode from "../pages/Inventory/Print/PrintBarcode.tsx";
import PrintLabelsView from "../pages/Inventory/Print/PrintLabelsView.tsx";
import WriteOffs from "../pages/Inventory/WriteOffs.tsx";
import PrintQRCode from "../pages/Inventory/Print/PrintQRCode.tsx";
import ExpiredProducts from "../pages/Inventory/Products/ExpiredProducts.tsx";
import LowStocks from "../pages/Inventory/Products/LowStocks.tsx";
import ProductForm from "../pages/Inventory/Products/ProductForm.tsx";
import Products from "../pages/Inventory/Products/Products.tsx";
import Units from "../pages/Inventory/Units/Units.tsx";
import VariantAttributes from "../pages/Inventory/VariantAttributes/VariantAttributes.tsx";
import AccountsOverview from "../pages/Accounts/AccountsOverview.tsx";
import CashFlow from "../pages/Accounts/CashFlow.tsx";
import EmployeeSales from "../pages/Accounts/EmployeeSales.tsx";
import ExpenseCategories from "../pages/Accounts/ExpenseCategories.tsx";
import ProfitLoss from "../pages/Accounts/ProfitLoss.tsx";
import Ledger from "../pages/Accounts/Ledger.tsx";
import Receivables from "../pages/Accounts/Receivables.tsx";
import StockValuation from "../pages/Accounts/StockValuation.tsx";
import CustomerProfile from "../pages/Customers/CustomerProfile.tsx";
import Customers from "../pages/Customers/Customers.tsx";
import DormantCustomers from "../pages/Customers/DormantCustomers.tsx";
import FollowUps from "../pages/Customers/FollowUps.tsx";
import StockLots from "../pages/Inventory/StockLots.tsx";
import PurchaseForm from "../pages/Purchasing/PurchaseForm.tsx";
import VendorPayments from "../pages/Purchasing/VendorPayments.tsx";
import Purchases from "../pages/Purchasing/Purchases.tsx";
import PurchaseView from "../pages/Purchasing/PurchaseView.tsx";
import VendorForm from "../pages/Purchasing/VendorForm.tsx";
import VendorProfile from "../pages/Purchasing/VendorProfile.tsx";
import Vendors from "../pages/Purchasing/Vendors.tsx";
import InvoiceView from "../pages/Sales/InvoiceView.tsx";
import PointOfSale from "../pages/Sales/PointOfSale.tsx";
import SalesList from "../pages/Sales/SalesList.tsx";
import SaleReturns from "../pages/Sales/SaleReturns.tsx";
import PurchaseReturns from "../pages/Purchasing/PurchaseReturns.tsx";
import RolePermissions from "../pages/Users/RolePermissions.tsx";
import Roles from "../pages/Users/Roles.tsx";
import Users from "../pages/Users/Users.tsx";
import ProtectedRoute from "./ProtectedRoute";

const routes = [
  {
    path: "/",
    errorElement: <ErrorPage />,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),

    children: [
      { path: "/", element: <Dashboard /> },
      { path: "media-library", element: <AllMediaLibraryList /> },
      // Inventory — product catalog plus the reference data defining a product.
      {
        path: "inventory",
        children: [
          { path: "products", element: <Products /> },
          // Create and edit are one component; the id is what tells them apart.
          { path: "products/create", element: <ProductForm /> },
          { path: "products/edit/:id", element: <ProductForm /> },
          { path: "products/expired", element: <ExpiredProducts /> },
          { path: "products/low-stock", element: <LowStocks /> },
          // One screen, two tabs. The old sub-category address still works and
          // opens on its own tab, so bookmarks and old links land where they
          // always did.
          { path: "categories", element: <CategoryTabs /> },
          {
            path: "sub-categories",
            element: <Navigate to="/inventory/categories?tab=sub-categories" replace />,
          },
          { path: "brands", element: <Brands /> },
          { path: "units", element: <Units /> },
          { path: "variant-attributes", element: <VariantAttributes /> },
          { path: "print-labels", element: <PrintLabelsView /> },
          { path: "write-offs", element: <WriteOffs /> },
          // Old addresses, now redirects — see the note in PrintBarcode.
          { path: "print-barcode", element: <PrintBarcode /> },
          { path: "print-qr-code", element: <PrintQRCode /> },
          { path: "stock-lots", element: <StockLots /> },
        ],
      },
      // Customers, and the relationship around them.
      {
        path: "customers",
        children: [
          { path: "", element: <Customers /> },
          // Before ":id", or these words are read as customer ids.
          { path: "follow-ups", element: <FollowUps /> },
          { path: "dormant", element: <DormantCustomers /> },
          { path: ":id", element: <CustomerProfile /> },
        ],
      },
      // The books.
      {
        path: "accounts",
        children: [
          { path: "", element: <AccountsOverview /> },
          { path: "ledger", element: <Ledger /> },
          { path: "profit-loss", element: <ProfitLoss /> },
          { path: "stock-valuation", element: <StockValuation /> },
          { path: "cash-flow", element: <CashFlow /> },
          { path: "expense-categories", element: <ExpenseCategories /> },
        ],
      },
      { path: "reports/employee-sales", element: <EmployeeSales /> },
      // Buying — where stock comes from, and who is owed for it.
      {
        path: "vendors",
        children: [
          { path: "", element: <Vendors /> },
          // Before ":id", or "new" is read as a vendor id.
          { path: "new", element: <VendorForm /> },
          { path: ":id/edit", element: <VendorForm /> },
          { path: ":id", element: <VendorProfile /> },
        ],
      },
      {
        path: "purchases",
        children: [
          { path: "", element: <Purchases /> },
          // Before ":id", or these words are read as bill ids.
          { path: "new", element: <PurchaseForm /> },
          { path: "payables", element: <Receivables mode="payable" /> },
          { path: "payments", element: <VendorPayments /> },
          { path: "returns", element: <PurchaseReturns /> },
          { path: ":id/edit", element: <PurchaseForm /> },
          { path: ":id", element: <PurchaseView /> },
        ],
      },
      // Selling — the till, and everything it wrote down.
      {
        path: "sales",
        children: [
          { path: "pos", element: <PointOfSale /> },
          { path: "invoices", element: <SalesList /> },
          { path: "invoices/:id", element: <InvoiceView /> },
          { path: "returns", element: <SaleReturns /> },
          { path: "receivables", element: <Receivables mode="receivable" /> },
        ],
      },
      // Employee Management — primary paths
      {
        path: "employees",
        children: [
          { path: "", element: <Users /> },
          { path: "roles", element: <Roles /> },
          // The permission sheet is its own page rather than a dialog — it is
          // long enough to want the window, and this way it has an address.
          { path: "roles/:id/permissions", element: <RolePermissions /> },
          { path: "designations", element: <Designation /> },
        ],
      },
      // Daily Income & Expense
      { path: "income-expense", element: <IncomeExpense /> },
      // Legacy /users/* paths kept for bookmarks / old links
      {
        path: "users",
        children: [
          { path: "", element: <Users /> },
          { path: "roles", element: <Roles /> },
          { path: "designations", element: <Designation /> },
        ],
      },
      // Logs (grouped in sidebar)
      {
        path: "logs",
        children: [
          { path: "actions", element: <AllActionLogs /> },
          { path: "errors", element: <AllErrorLogs /> },
        ],
      },
      // Legacy direct path kept for backwards compatibility
      { path: "action-logs", element: <AllActionLogs /> },
      // Notifications
      { path: "notifications", element: <AllNotifications /> },
      // Settings Routes
      {
        path: "settings",
        children: [
          { path: "profile", element: <Profile /> },
          { path: "designation", element: <Designation /> },

          { path: "payment-providers", element: <Providers /> },
          { path: "notification-sounds", element: <NotificationSounds /> },
          { path: "media-bin", element: <MediaBin /> },
        ],
      },
    ],
  },
  // Fallback Route
  { path: "404", element: <ErrorPage /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
];

const router = createBrowserRouter(routes);

export default router;
