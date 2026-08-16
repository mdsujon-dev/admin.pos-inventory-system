import { Checkbox, Empty, Input, Spin } from "antd";
import { Check, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import { PERMISSION_GROUP_ORDER } from "../../components/modal/settings/role/permissionModules";
import { usePermissionModules } from "../../components/modal/settings/role/usePermissionModules";
// The panel's own button, not Ant Design's — one button style across the app.
import Button from "../../components/ui/Button";
import { useGetRoleByIdQuery } from "../../redux/features/role/roleApi";
import {
  useCreateRolePermissionMutation,
  useDeleteRolePermissionMutation,
  useGetRolePermissionsByRoleIdQuery,
  useUpdateRolePermissionMutation,
} from "../../redux/features/rolePermission/rolePermissionApi";

/**
 * The permission sheet for one role — a page, not a dialog.
 *
 * It outgrew a modal. There are now sixty-odd modules across nine sections, and
 * a dialog gave them a scrolling box inside a scrolling box, no address worth
 * sharing, and no way back except discarding. On its own route the sheet gets
 * the whole window, the browser's Back button means what it says, and "look at
 * what the accountant role can reach" is a link somebody can send.
 *
 * The catalogue itself still lives in `permissionModules.ts`, which is also
 * what the sidebar and the route guards read — one list, so a module cannot be
 * grantable here and ungated there.
 */
const RolePermissions = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const {
    modules: PERMISSION_MODULES,
    totalCount: TOTAL_PERMISSION_COUNT,
    distinctActions: DISTINCT_PERMISSION_ACTIONS,
  } = usePermissionModules();

  // Flat ids: ["Products-View", "Products-Create", ...]
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const { data: roleData, isFetching: loadingRole } = useGetRoleByIdQuery(id, {
    skip: !id,
  });
  const role = roleData?.data ?? roleData;

  const { data: rolePermsData, isFetching: loadingRolePerms } =
    useGetRolePermissionsByRoleIdQuery(id, { skip: !id });

  const [createRolePermission, { isLoading: creating }] =
    useCreateRolePermissionMutation();
  const [updateRolePermission, { isLoading: updating }] =
    useUpdateRolePermissionMutation();
  const [deleteRolePermission, { isLoading: deleting }] =
    useDeleteRolePermissionMutation();

  const rolePermissions = useMemo(
    () => rolePermsData?.data || [],
    [rolePermsData]
  );

  /**
   * Fill the sheet from what the role already holds — once.
   *
   * The modal keyed this on `open`, which a page does not have. Guarding on a
   * `hydrated` flag instead matters more here than it did there: a refetch
   * triggered by saving would otherwise overwrite edits still in progress.
   */
  useEffect(() => {
    if (hydrated || loadingRolePerms) return;
    const flat: string[] = [];
    rolePermissions.forEach((rp: any) => {
      (rp.permissions || []).forEach((p: string) => {
        flat.push(`${rp.module}-${p}`);
      });
    });
    setSelected(flat);
    setHydrated(true);
  }, [hydrated, loadingRolePerms, rolePermissions]);

  const filteredModules = useMemo(() => {
    if (!search.trim()) return PERMISSION_MODULES;
    const q = search.toLowerCase();
    return PERMISSION_MODULES.filter((m) => m.module.toLowerCase().includes(q));
  }, [search, PERMISSION_MODULES]);

  const groupedModules = useMemo(
    () =>
      PERMISSION_GROUP_ORDER.map((group) => ({
        group,
        modules: filteredModules.filter((m) => m.group === group),
      })).filter((g) => g.modules.length > 0),
    [filteredModules]
  );

  const togglePermission = (permId: string) =>
    setSelected((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId]
    );

  const isModuleFullySelected = (moduleName: string) => {
    const mod = PERMISSION_MODULES.find((m) => m.module === moduleName);
    if (!mod) return false;
    return mod.permissions.every((p) => selected.includes(`${moduleName}-${p}`));
  };

  const isModulePartiallySelected = (moduleName: string) => {
    const mod = PERMISSION_MODULES.find((m) => m.module === moduleName);
    if (!mod) return false;
    const ids = mod.permissions.map((p) => `${moduleName}-${p}`);
    const sel = ids.filter((permId) => selected.includes(permId));
    return sel.length > 0 && sel.length < ids.length;
  };

  const toggleModule = (moduleName: string) => {
    const mod = PERMISSION_MODULES.find((m) => m.module === moduleName);
    if (!mod) return;
    const ids = mod.permissions.map((p) => `${moduleName}-${p}`);
    if (isModuleFullySelected(moduleName)) {
      setSelected((prev) => prev.filter((p) => !ids.includes(p)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  /** Quick Grant: toggle `action` on every module that offers it. */
  const handleQuickGrant = (action: string) => {
    setSelected((prev) => {
      const relevantModules = PERMISSION_MODULES.filter((m) =>
        m.permissions.includes(action)
      );
      const isFullySelected = relevantModules.every((m) =>
        prev.includes(`${m.module}-${action}`)
      );

      if (isFullySelected) {
        const toRemove = new Set(
          relevantModules.map((m) => `${m.module}-${action}`)
        );
        return prev.filter((item) => !toRemove.has(item));
      } else {
        const next = new Set(prev);
        relevantModules.forEach((m) => next.add(`${m.module}-${action}`));
        return Array.from(next);
      }
    });
  };

  const handleSelectAll = () => {
    const all: string[] = [];
    PERMISSION_MODULES.forEach((m) =>
      m.permissions.forEach((p) => all.push(`${m.module}-${p}`))
    );
    setSelected(all);
  };

  const handleClearAll = () => setSelected([]);

  const allSelected = selected.length === TOTAL_PERMISSION_COUNT;
  const someSelected = selected.length > 0 && !allSelected;

  /**
   * Turn the flat selection back into `{ module, permissions[] }` rows and diff
   * them against what the role already has, so only what actually changed is
   * written — and a module that lost its last action is deleted rather than
   * left behind as an empty grant.
   */
  const handleSave = async () => {
    try {
      const existingByModule = new Map<string, any>();
      rolePermissions.forEach((rp: any) => existingByModule.set(rp.module, rp));

      const desired = new Map<string, string[]>();
      PERMISSION_MODULES.forEach((m) => {
        const picked = m.permissions.filter((p) =>
          selected.includes(`${m.module}-${p}`)
        );
        if (picked.length > 0) desired.set(m.module, picked);
      });

      const ops: Promise<any>[] = [];

      desired.forEach((perms, moduleName) => {
        const existing = existingByModule.get(moduleName);
        if (existing) {
          const a = [...(existing.permissions || [])].sort().join(",");
          const b = [...perms].sort().join(",");
          if (a !== b) {
            ops.push(
              updateRolePermission({
                id: existing._id,
                data: { permissions: perms },
              }).unwrap()
            );
          }
        } else {
          ops.push(
            createRolePermission({
              roleId: id,
              module: moduleName,
              permissions: perms,
            }).unwrap()
          );
        }
      });

      rolePermissions.forEach((rp: any) => {
        if (!desired.has(rp.module)) {
          ops.push(deleteRolePermission(rp._id).unwrap());
        }
      });

      if (ops.length === 0) {
        toast.info("No changes to save");
        return;
      }

      await Promise.all(ops);
      toast.success("Permissions updated successfully!");
      navigate("/employees/roles");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update permissions");
    }
  };

  const loading = loadingRole || loadingRolePerms;
  const saving = creating || updating || deleting;

  return (
    <div>
      <PageMeta
        title="Role Permissions - POS & Inventory Admin Panel"
        description="Configure which modules and actions a role can reach."
        noindex
      />

      <PageHeader
        title={role?.role ? `Permissions — ${role.role}` : "Role Permissions"}
        subtitle={
          role?.description ||
          "Every module in the panel, and the actions this role may take on it"
        }
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Roles", path: "/employees/roles" },
          { title: "Permissions" },
        ]}
      />

      <Spin spinning={loading}>
        {/* Controls. Scrolls with the page like everything else. */}
        <div className="mb-5 rounded-xl border border-secondary-200 bg-gradient-to-r from-secondary-50 to-primary-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Input
              placeholder="Search modules..."
              prefix={<Search className="h-4 w-4 text-secondary-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="sm:max-w-xs"
            />

            {/* The running count stays up here where it is read while working.
                Saving lives at the foot of the sheet, after the thing being
                saved. */}
            <div className="text-right">
              <span className="block text-xs font-bold uppercase tracking-tight text-secondary-400">
                Selected
              </span>
              <span className="text-sm font-bold text-primary">
                {selected.length} / {TOTAL_PERMISSION_COUNT}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-secondary-200/70 pt-3">
            <span className="mr-1 text-xs font-bold uppercase tracking-widest text-secondary-500">
              Quick grant:
            </span>
            {/* `custom` rather than `outline`: the outline variant fills with
                the brand green on hover, and a row of buttons that all turn
                solid green under the pointer reads as if each one is already
                on. Hover lifts the shadow instead. */}
            {DISTINCT_PERMISSION_ACTIONS.map((a) => {
              const relevantModules = PERMISSION_MODULES.filter((m) => m.permissions.includes(a));
              const isFullySelected = relevantModules.length > 0 && relevantModules.every((m) => selected.includes(`${m.module}-${a}`));

              return (
                <Button
                  key={a}
                  variant="custom"
                  className={`!rounded-[6px] !px-4 !py-1.5 !text-xs !font-semibold !shadow-none transition-all hover:!shadow-card-hover ${
                    isFullySelected
                      ? "!border !border-primary !bg-primary !text-white"
                      : "!border !border-secondary-200 !bg-white !text-secondary-700 hover:!border-secondary-300"
                  }`}
                  onClick={() => handleQuickGrant(a)}
                >
                  {a} All
                </Button>
              );
            })}
            <Button
              variant="custom"
              className="!ml-auto !rounded-[6px] !border !border-primary-200 !bg-white !px-4 !py-1.5 !text-xs !font-semibold !text-primary-600 !shadow-none hover:!border-primary-300 hover:!shadow-card-hover"
              onClick={handleClearAll}
            >
              Reset All
            </Button>
          </div>
        </div>

        <div className="mb-4 px-1">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={(e) =>
              e.target.checked ? handleSelectAll() : handleClearAll()
            }
          >
            <span className="text-sm font-semibold text-secondary-700">
              Select all system permissions
            </span>
          </Checkbox>
        </div>

        {/* No inner scroll box — the page scrolls, which is the whole point of
            not being a dialog. */}
        {filteredModules.length === 0 ? (
          <Empty description="No modules match your search" className="py-10" />
        ) : (
          <div className="space-y-6 pb-10">
            {groupedModules.map(({ group, modules }) => (
              <div key={group}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="m-0 whitespace-nowrap text-sm font-bold uppercase tracking-wide text-secondary-700">
                    {group}
                  </h3>
                  <span className="h-px flex-1 bg-secondary-200" />
                  <span className="text-xs font-medium text-secondary-400">
                    {modules.length} module{modules.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {modules.map((m) => {
                    const isAll = isModuleFullySelected(m.module);
                    const isPartial = isModulePartiallySelected(m.module);
                    return (
                      <div
                        key={m.module}
                        /* Hover lifts the shadow; it never borrows the brand
                           green. On this sheet green is the colour of "granted",
                           so a card that turns green under the pointer reads as
                           a card that just changed. */
                        className={`rounded-xl border bg-white p-5 transition-all hover:shadow-card-hover ${
                          isAll
                            ? "border-primary/60 ring-1 ring-primary/10"
                            : "border-secondary-200"
                        }`}
                      >
                        <div className="mb-4 flex items-center justify-between gap-2 border-b border-secondary-100 pb-3">
                          <h4 className="m-0 truncate text-xs font-bold uppercase tracking-wide text-secondary-800">
                            {m.module}
                          </h4>
                          <Checkbox
                            checked={isAll}
                            indeterminate={isPartial}
                            onChange={() => toggleModule(m.module)}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {m.permissions.map((perm) => {
                            const permId = `${m.module}-${perm}`;
                            const active = selected.includes(permId);
                            return (
                              /* Green means granted, and only granted. An
                                 unselected chip that turns green under the
                                 pointer makes the reader check twice whether
                                 they just clicked it. */
                              <Button
                                key={perm}
                                variant={active ? "primary" : "custom"}
                                onClick={() => togglePermission(permId)}
                                className={`inline-flex items-center gap-1 !rounded-[6px] !px-3 !py-1.5 !text-xs !font-semibold !shadow-none hover:!shadow-card-hover ${
                                  active
                                    ? ""
                                    : "!border !border-secondary-200 !bg-white !text-secondary-600 hover:!border-secondary-300"
                                }`}
                              >
                                {active && <Check className="h-3 w-3" />}
                                {perm}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* after everything it saves —
            the order the page is actually worked through. */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-secondary-200 pt-5">
          <span className="mr-auto text-sm text-secondary-500">
            <span className="font-bold text-primary">{selected.length}</span> of{" "}
            {TOTAL_PERMISSION_COUNT} permissions selected
          </span>
          <Button
            variant="custom"
            className="!rounded-[6px] !border !border-secondary-200 !bg-white !px-6 !py-2 !text-sm !font-semibold !text-secondary-700 !shadow-none hover:!border-secondary-300 hover:!shadow-card-hover"
            onClick={() => navigate("/employees/roles")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="!rounded-[6px] !px-10 !py-2 !text-sm !font-semibold hover:!shadow-card-hover"
            onClick={handleSave}
            loading={saving}
            disabled={loading}
          >
            Save Permissions
          </Button>
        </div>
      </Spin>
    </div>
  );
};

export default RolePermissions;
