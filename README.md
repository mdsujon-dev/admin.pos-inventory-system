# POS & Inventory — Admin Panel

The staff control panel for the **POS & Inventory** system. Manage employees,
roles, permissions, the income/expense ledger and media — with a sidebar, routes
and per-row actions all gated by the signed-in user's role permissions.

Built with React 18 + Vite + TypeScript, talking to the
[API server](../server.pos-inventory-system) over REST.

> **Status.** This panel started as a training-institute admin and has been
> stripped back to what a POS needs. The product, stock and sale screens are not
> written yet — the dashboard shows the ledger only, and its grid is where they
> plug in.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | **React 18** + **Vite** + TypeScript |
| Data | **Redux Toolkit / RTK Query** + redux-persist |
| UI | **Ant Design** + **Tailwind CSS** |
| Charts | **Recharts** (dashboard) |
| Icons | lucide-react + react-icons |
| Routing | react-router-dom v6 |
| Export | xlsx, jsPDF |
| Realtime | socket.io-client (live notifications) |

---

## Getting started

### 1. Install

```bash
npm install
```

> `postinstall` copies TinyMCE assets into `public/tinymce`.

### 2. Environment

`.env.development` (Vite reads `VITE_`-prefixed vars):

```ini
VITE_PUBLIC_SERVER_URL=http://localhost:5009
VITE_PUBLIC_API_URL=http://localhost:5009/api
VITE_PUBLIC_IMAGE_ACCESS_URL=http://localhost:5009/uploads
VITE_PUBLIC_APP_DOMAIN=http://localhost:3014
```

### 3. Run

```bash
npm run dev      # Vite dev server  →  http://localhost:3014
```

The API's `CORS_ORIGIN` must list this origin or every request is refused by the
browser.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server on port `3014` |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## Project structure

```
src/
├── access/                  # ACTION_PERMISSIONS — the permission behind each button
├── components/
│   ├── Dashboard/Sidebar/   # section-grouped, permission-filtered sidebar
│   ├── modal/               # create/update/permission modals
│   ├── Form/                # shared form inputs
│   └── Common/              # PageHeader, PermissionGate, RichEditor, …
├── pages/                   # one folder per screen
│   ├── Dashboard/           # ledger tiles + income vs expense chart
│   ├── Users/               # employees, roles, role permissions
│   ├── IncomeExpense/       # the ledger
│   ├── media-library/       # uploads, folders
│   └── Settings/            # profile, designations, countries, media bin
├── redux/
│   ├── api/baseApi.ts       # RTK Query base
│   └── features/            # per-domain API slices + auth slice
├── routes/                  # routes.tsx, ProtectedRoute, routePermissions
├── hooks/                   # useMe, useHasPermission, useFilteredSidebar, …
└── utils/                   # permission helpers, formatters, …
```

---

## How access control works

Everyone who signs in is an employee, so access is entirely data — there are no
code-defined per-persona screen lists.

- **`/user/me`** returns the user + their role permissions. `useMe()` caches it
  and polls, so a permission change made by an admin auto-reloads affected
  users within a minute.
- **Sidebar** items with a `module` are hidden unless the role has access
  (`useFilteredSidebar`); items without a `module` (Dashboard, Profile) are
  always visible.
- **Routes** are guarded by `routePermissions.ts` + `ProtectedRoute`. A denied
  route sends the user home with a notice, not to a 404.
- **Row actions** (status toggle, edit, delete) are wrapped in `PermissionGate`
  / `useHasPermission`, so they disable or disappear without the right access.
- **The catalog** an admin ticks from lives in
  `components/modal/settings/role/permissionModules.ts`. Keep it in step with
  the sidebar and with the module names the server passes to `checkPermission`.
- **SUPER_ADMIN** bypasses everything and is hidden from role/user lists.

---

## Known state

`npx tsc --noEmit` reports pre-existing errors in `src/Icons/Index.tsx`
(implicit `any` on SVG props), `src/types/index.ts` (a duplicated `avatar`
declaration) and `src/components/ui/PrimaryButton.tsx` (react-router `Link`
props). They predate this codebase's conversion; `npm run build` succeeds
because Vite does not type-check.
