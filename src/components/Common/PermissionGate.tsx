import React from "react";
import { useMe } from "../../hooks/useMe";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  PermissionRequirement,
} from "../../utils/permission";

interface BaseProps {
  /** Rendered when the user is denied. Defaults to `null`. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface SinglePermissionProps extends BaseProps {
  module: string;
  action: string;
  any?: never;
  all?: never;
}

interface AnyPermissionProps extends BaseProps {
  any: PermissionRequirement[];
  module?: never;
  action?: never;
  all?: never;
}

interface AllPermissionsProps extends BaseProps {
  all: PermissionRequirement[];
  module?: never;
  action?: never;
  any?: never;
}

export type PermissionGateProps =
  | SinglePermissionProps
  | AnyPermissionProps
  | AllPermissionsProps;

/**
 * Declarative permission gate — wrap any JSX (buttons, links, sections) and
 * it renders only when the current user has the required permission.
 *
 * SUPER_ADMIN always passes. The check is case-insensitive on action.
 *
 * Three usage shapes:
 *
 *   <PermissionGate module="Users" action="Create">
 *     <Button>Add User</Button>
 *   </PermissionGate>
 *
 *   <PermissionGate any={[
 *     { module: "BD Services", action: "View" },
 *     { module: "Egypt Services", action: "View" },
 *   ]}>
 *     <ServiceList />
 *   </PermissionGate>
 *
 *   <PermissionGate all={[
 *     { module: "Blog Posts", action: "Update" },
 *     { module: "Media Library", action: "Create" },
 *   ]}>
 *     <ImageUploadInBlogEditor />
 *   </PermissionGate>
 *
 *   // Render a disabled placeholder instead of nothing:
 *   <PermissionGate
 *     module="Blog Posts"
 *     action="Delete"
 *     fallback={<Button disabled>Delete</Button>}
 *   >
 *     <Button danger onClick={handleDelete}>Delete</Button>
 *   </PermissionGate>
 */
const PermissionGate: React.FC<PermissionGateProps> = (props) => {
  const { me } = useMe();
  const { children, fallback = null } = props;

  let allowed = false;
  if ("any" in props && props.any) {
    allowed = hasAnyPermission(me, props.any);
  } else if ("all" in props && props.all) {
    allowed = hasAllPermissions(me, props.all);
  } else if ("module" in props && "action" in props && props.module && props.action) {
    allowed = hasPermission(me, props.module, props.action);
  }

  return <>{allowed ? children : fallback}</>;
};

export default PermissionGate;
