import { createBrowserRouter } from "react-router-dom";
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
import Countries from "../pages/Settings/Countries/Countries.tsx";
import Designation from "../pages/Settings/Desgination/Designation.tsx";
import MediaBin from "../pages/Settings/MediaBin/MediaBin.tsx";
import NotificationSounds from "../pages/Settings/NotificationSounds/NotificationSounds.tsx";
import UnderDevelopment from "../pages/UnderDevelopment/UnderDevelopment.tsx";
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
      // Inventory — the screens themselves aren't built yet, so every entry
      // resolves to the placeholder. The addresses are the contract the
      // sidebar and the permission map are already written against; swapping
      // in a real page later touches only the `element` on that one line.
      {
        path: "inventory",
        children: [
          { path: "products", element: <UnderDevelopment /> },
          { path: "products/create", element: <UnderDevelopment /> },
          { path: "products/expired", element: <UnderDevelopment /> },
          { path: "products/low-stock", element: <UnderDevelopment /> },
          { path: "categories", element: <UnderDevelopment /> },
          { path: "sub-categories", element: <UnderDevelopment /> },
          { path: "brands", element: <UnderDevelopment /> },
          { path: "units", element: <UnderDevelopment /> },
          { path: "variant-attributes", element: <UnderDevelopment /> },
          { path: "warranties", element: <UnderDevelopment /> },
          { path: "print-barcode", element: <UnderDevelopment /> },
          { path: "print-qr-code", element: <UnderDevelopment /> },
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
          { path: "countries", element: <Countries /> },
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
