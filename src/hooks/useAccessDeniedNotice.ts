import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * Says why the page they asked for is not the page they got.
 *
 * `ProtectedRoute` sends someone without the permission back to their own home
 * rather than to a 404. That is the right destination and a baffling one: from
 * the outside, a link simply did nothing and the dashboard reappeared. People
 * conclude the button is broken and report it, which costs somebody an
 * afternoon finding out the system worked exactly as designed.
 *
 * So the redirect carries `state.deniedPath`, and this turns it into one line
 * of plain English. The state is then cleared with `replace` so pressing Back
 * or reloading does not show the message a second time.
 */
export const useAccessDeniedNotice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // React 18's StrictMode mounts effects twice in development; without this the
  // toast appears in duplicate and looks like a bug of its own.
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const denied = (location.state as { deniedPath?: string } | null)
      ?.deniedPath;
    if (!denied || shown.current === denied) return;

    shown.current = denied;
    toast.info(
      `You do not have access to ${denied}. Ask an administrator if you need it.`
    );
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);
};

export default useAccessDeniedNotice;
