import { Navigate } from "react-router-dom";

/**
 * Merged into Print Labels, which does both formats behind a toggle.
 *
 * Kept as a redirect rather than deleted: the old address is in people's
 * bookmarks and in the browser history of everyone who used it, and a 404 for
 * a screen that still exists under a different name is a support call.
 */
const PrintBarcode = () => <Navigate to="/inventory/print-labels" replace />;

export default PrintBarcode;
