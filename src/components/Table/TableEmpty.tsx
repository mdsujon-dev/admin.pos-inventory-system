import React from "react";
import { Inbox } from "lucide-react";

export interface TableEmptyProps {
  /** What is not here. One short line, in the screen's own words. */
  title: string;
  /** Why it might be missing, or what to do about it. */
  hint?: React.ReactNode;
  icon?: React.ElementType;
  /** The hue of the icon halo. Defaults to the brand green. */
  accent?: string;
  /** An offer to fix the emptiness — a create button, a cleared filter. */
  action?: React.ReactNode;
}

/**
 * What a table shows when it has nothing to show.
 *
 * AntD's default is the word "No Data" under a grey box, which is accurate and
 * useless: a list is empty either because nothing exists yet or because a
 * filter excluded everything, and only the screen knows which. This gives that
 * sentence somewhere to live, with enough shape around it that an empty table
 * reads as a deliberate state rather than a table that failed to load.
 */
const TableEmpty = ({
  title,
  hint,
  icon: Icon = Inbox,
  accent = "#019532",
  action,
}: TableEmptyProps) => (
  <div className="flex flex-col items-center justify-center gap-3 py-4">
    <span
      className="grid h-14 w-14 place-items-center rounded-2xl"
      style={{
        background: `${accent}0f`,
        border: `1px solid ${accent}26`,
        color: accent,
      }}
    >
      <Icon className="h-6 w-6" />
    </span>
    <div className="text-center">
      <p className="m-0 text-[14px] font-semibold text-secondary-700">
        {title}
      </p>
      {hint && (
        <p className="m-0 mt-1 text-[12px] text-secondary-400">{hint}</p>
      )}
    </div>
    {action}
  </div>
);

export default TableEmpty;
