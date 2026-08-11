/**
 * Predefined access — one folder for "who sees what", kept out of the pages.
 *
 * Everyone who signs in is an employee, so there are no fixed per-persona
 * screen lists to mirror any more: access is data. A role's permissions come
 * back on `/user/me`, and the sidebar is whatever they add up to
 * (`useFilteredSidebar`) while the URL gate is `routes/routePermissions.ts`.
 *
 * What lives here:
 *   - `ACTION_PERMISSIONS` — the permission behind every gated button, named once
 */
export * from "./actionPermissions";

/** Where someone is sent when they land somewhere that isn't theirs. */
export const HOME_ROUTE = "/";
