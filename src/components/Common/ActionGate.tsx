import React from "react";
import { ActionKey } from "../../access";
import useCanAction from "../../hooks/useCanAction";

interface ActionGateProps {
  /** A name from the predefined catalog, e.g. "finance.create". */
  action: ActionKey;
  /** Rendered when the user is denied. Defaults to `null` — the button vanishes. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Permission gate for a named button.
 *
 *     <ActionGate action="employees.create">
 *       <Button>Add Employee</Button>
 *     </ActionGate>
 *
 * The same job as `<PermissionGate module="Employees" action="Create">`, with the
 * module and action looked up from `src/access/actionPermissions.ts` instead of
 * typed in. Worth the indirection where a button appears on more than one screen:
 * the two copies cannot end up gated differently, and renaming a module is one
 * edit rather than a search.
 */
const ActionGate: React.FC<ActionGateProps> = ({
  action,
  fallback = null,
  children,
}) => {
  const allowed = useCanAction(action);
  return <>{allowed ? children : fallback}</>;
};

export default ActionGate;
