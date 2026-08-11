import React from "react";

interface DateTimeStackedProps {
  /** ISO string, Date object, or anything `new Date(...)` accepts. */
  value?: string | number | Date | null;
  /** Override the label shown when `value` is missing/invalid. Defaults to "—". */
  emptyText?: string;
  /** Optional className applied to the outer wrapper. */
  className?: string;
}

// Two-line timestamp used in admin tables: date on top, time below in muted
// gray. Keeps narrow columns readable without sacrificing precision. Use
// instead of `new Date(v).toLocaleString()` so every table renders timestamps
// identically.
const DateTimeStacked: React.FC<DateTimeStackedProps> = ({
  value,
  emptyText = "—",
  className,
}) => {
  if (!value) {
    return <span className="text-xs text-gray-400">{emptyText}</span>;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return <span className="text-xs text-gray-400">{emptyText}</span>;
  }

  const datePart = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`text-xs leading-tight whitespace-nowrap ${className ?? ""}`}
    >
      <div className="text-gray-700">{datePart}</div>
      <div className="text-gray-400">{timePart}</div>
    </div>
  );
};

export default DateTimeStacked;
