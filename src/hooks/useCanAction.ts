import { ActionKey, requirementFor } from "../access";
import { hasPermission } from "../utils/permission";
import { useMe } from "./useMe";

/**
 * Can the current user press this button?
 *
 *     const canTake = useCanAction("attendance.take");
 *
 * Takes a name from the predefined catalog rather than a `{module, action}` pair,
 * so the permission behind a button is decided in one file instead of being
 * re-spelled at every call site. SUPER_ADMIN passes everything; an unknown name
 * is denied, so a typo hides the button rather than exposing it.
 */
export const useCanAction = (action: ActionKey): boolean => {
  const { me } = useMe();
  const requirement = requirementFor(action);
  if (!requirement) return false;
  return hasPermission(me, requirement.module, requirement.action);
};

export default useCanAction;
