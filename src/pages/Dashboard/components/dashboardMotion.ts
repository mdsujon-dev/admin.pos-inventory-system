import type { Variants } from "framer-motion";

/**
 * The rise-into-place used by every panel on both dashboards.
 *
 * In its own file rather than beside the components it is used with: a module
 * that exports both components and plain values breaks Vite's fast refresh,
 * which then reloads the whole page on every edit instead of swapping the one
 * component that changed.
 *
 * Annotated rather than left to inference — pulled out of the JSX, `ease`
 * widens to `string` and no longer satisfies Framer's easing union.
 */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default riseIn;
