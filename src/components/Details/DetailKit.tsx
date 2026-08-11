import React from "react";
import Button from "../ui/Button";

/**
 * The shared look of the four details pages — course, batch, student, faculty.
 *
 * Deliberately hand-built rather than Ant Design's Card and Descriptions:
 * those carry their own padding, borders and font scale, and fighting them
 * with overrides is how four pages end up looking like four products. These
 * are thin wrappers around Tailwind, so the spacing rhythm and the type scale
 * are decided in one place and every page inherits them.
 */

/* ── Panel ──────────────────────────────────────────────────────────────── */

export const Panel = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) => (
  <section
    className={`overflow-hidden rounded-xl border border-secondary-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)] ${
      className || ""
    }`}
  >
    {(title || action) && (
      /**
       * Stacks on a phone and sits on one line from `sm` up.
       *
       * The action is not always a single button — a schedule's five range
       * chips, a filter row — and squeezing that beside the title on a 360px
       * screen either crushes the heading to three letters or pushes the panel
       * wider than the viewport. Below the title it gets the full width, which
       * is also where a thumb expects to find controls.
       */
      <header className="flex flex-col gap-2 border-b border-secondary-100/80 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-5 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-[15px] font-semibold leading-tight text-secondary-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="truncate text-xs text-secondary-400">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="min-w-0 sm:ml-auto sm:shrink-0">{action}</div>
        )}
      </header>
    )}
    <div className={bodyClassName ?? "p-4 sm:p-5"}>{children}</div>
  </section>
);

/* ── Field ──────────────────────────────────────────────────────────────── */

export const Field = ({
  label,
  children,
  mono,
}: {
  label: string;
  children?: React.ReactNode;
  mono?: boolean;
}) => {
  // An empty value is shown as a dash rather than nothing: a blank space reads
  // as a rendering fault, a dash reads as "we do not have this".
  const empty =
    children === undefined ||
    children === null ||
    children === "" ||
    (Array.isArray(children) && children.length === 0);

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-secondary-400">
        {label}
      </p>
      <div
        className={`mt-1 break-words text-sm ${
          empty ? "text-secondary-300" : "font-medium text-secondary-800"
        } ${mono ? "font-mono" : ""}`}
      >
        {empty ? "—" : children}
      </div>
    </div>
  );
};

export const FieldGrid = ({
  cols = 3,
  children,
}: {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}) => (
  <div
    className={`grid gap-x-6 gap-y-5 ${
      cols === 2
        ? "sm:grid-cols-2"
        : cols === 4
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : "sm:grid-cols-2 lg:grid-cols-3"
    }`}
  >
    {children}
  </div>
);

/* ── Stat ───────────────────────────────────────────────────────────────── */

export type StatTone = "neutral" | "green" | "red" | "amber" | "blue";

const STAT_TONE: Record<StatTone, { value: string; chip: string; bg: string }> = {
  neutral: {
    value: "text-secondary-900",
    chip: "bg-secondary-100 text-secondary-500",
    bg: "bg-white hover:bg-secondary-50/50 border-secondary-100",
  },
  green: { 
    value: "text-primary", 
    chip: "bg-primary-50 text-primary",
    bg: "bg-gradient-to-br from-white to-primary-50/60 border-primary-100/50 hover:to-primary-50",
  },
  red: { 
    value: "text-red-600", 
    chip: "bg-red-50 text-red-500",
    bg: "bg-gradient-to-br from-white to-red-50/60 border-red-100/50 hover:to-red-50",
  },
  amber: { 
    value: "text-amber-600", 
    chip: "bg-amber-50 text-amber-600",
    bg: "bg-gradient-to-br from-white to-amber-50/60 border-amber-100/50 hover:to-amber-50",
  },
  blue: { 
    value: "text-blue-600", 
    chip: "bg-blue-50 text-blue-500",
    bg: "bg-gradient-to-br from-white to-blue-50/60 border-blue-100/50 hover:to-blue-50",
  },
};

export const Stat = ({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: StatTone;
  icon?: React.ElementType;
}) => {
  const t = STAT_TONE[tone];
  return (
    <div className={`rounded-xl border p-4 shadow-sm transition-colors duration-300 ${t.bg}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.chip}`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-secondary-400">
            {label}
          </p>
          <p
            className={`mt-0.5 truncate text-[22px] font-semibold leading-tight ${t.value}`}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 truncate text-[11px] text-secondary-400">
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const StatRow = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
);

/* ── Pill ───────────────────────────────────────────────────────────────── */

export type PillTone = "neutral" | "green" | "red" | "amber" | "blue";

const PILL_TONE: Record<PillTone, string> = {
  neutral: "bg-secondary-100 text-secondary-600",
  green: "bg-primary-50 text-primary ring-1 ring-inset ring-primary/15",
  red: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/15",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20",
  blue: "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/15",
};

export const Pill = ({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: PillTone;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
      PILL_TONE[tone]
    } ${className || ""}`}
  >
    {children}
  </span>
);

/* ── Hero ───────────────────────────────────────────────────────────────── */

/**
 * The banner at the top of a details page: who or what this is, at a glance,
 * with the two or three numbers that matter most sitting on the same band.
 */
export const Hero = ({
  avatar,
  title,
  subtitle,
  meta,
  stats,
  action,
}: {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  stats?: { label: string; value: React.ReactNode }[];
  action?: React.ReactNode;
}) => (
  <div className="relative mb-4 overflow-hidden rounded-xl border border-secondary-100 bg-white shadow-sm">
    {/* A vibrant radial gradient that looks more premium */}
    <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-400 via-primary-700 to-primary-900" />
    <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-white/20 blur-[60px]" />
    <div className="pointer-events-none absolute left-10 top-0 h-32 w-48 rounded-full bg-primary-300/30 blur-[40px]" />
    
    <div className="relative px-4 pb-4 pt-5 sm:px-5 sm:pb-5 sm:pt-6">
      {/* Avatar over the name on a phone rather than beside it: side by side,
          an 80px picture leaves about 200px for a name that is often longer
          than that, and the subtitle underneath it gets nothing. */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="w-full min-w-0 flex-1 sm:w-auto sm:pb-1">
          <h2 className="truncate text-lg font-bold text-white drop-shadow-sm sm:text-xl">
            {title}
          </h2>
          {subtitle && (
            <div className="mt-0.5 text-sm font-medium text-white/90 drop-shadow-sm">
              {subtitle}
            </div>
          )}
          {meta && <div className="mt-2 flex flex-wrap gap-1.5">{meta}</div>}
        </div>
        {action && <div className="mt-2 w-full pb-1 sm:mt-0 sm:w-auto">{action}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-secondary-100 bg-secondary-100 shadow-sm sm:mt-5 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="min-w-0 bg-white/95 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3"
            >
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-secondary-500 sm:text-[11px]">
                {s.label}
              </p>
              <p className="mt-1 truncate text-base font-bold text-secondary-900 sm:text-lg">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

/* ── Tabs ───────────────────────────────────────────────────────────────── */

export const TabBar = ({
  tabs,
  active,
  onChange,
}: {
  tabs: {
    key: string;
    label: string;
    icon?: React.ElementType;
    count?: number;
  }[];
  active: string;
  onChange: (key: string) => void;
}) => (
  /**
   * Scrolls sideways when the tabs do not fit, which on a phone is most of the
   * time. `scrollbar-hide` because a visible bar under four chips reads as a
   * broken layout; the tabs are wide enough to be obviously draggable, and the
   * partially-cut last chip is the affordance that says so.
   */
  <div className="scrollbar-hide mb-4 flex gap-1 overflow-x-auto rounded-[8px] border border-secondary-100 bg-white p-1">
    {tabs.map((t) => {
      const Icon = t.icon;
      const on = t.key === active;
      return (
        <Button
          key={t.key}
          onClick={() => onChange(t.key)}
          variant={on ? "primary" : "custom"}
          // py-2 on a phone: 1.5 leaves a target under the 44px a thumb needs.
          // Unchanged from `sm` up.
          className={`flex shrink-0 items-center gap-1.5 !px-3 !py-2 !text-sm !shadow-none !rounded-[6px] sm:!gap-2 sm:!px-4 sm:!py-1.5 ${
            on
              ? ""
              : "text-secondary-500 hover:bg-secondary-50 hover:text-secondary-800 bg-transparent"
          }`}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {t.label}
          {t.count !== undefined && (
            <span
              className={`rounded-full px-1.5 text-[11px] font-semibold ${
                on ? "bg-white/20" : "bg-secondary-100 text-secondary-500"
              }`}
            >
              {t.count}
            </span>
          )}
        </Button>
      );
    })}
  </div>
);

/* ── Empty ──────────────────────────────────────────────────────────────── */

export const EmptyNote = ({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-secondary-200 px-6 py-10 text-center">
    {Icon && (
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-secondary-50 text-secondary-300">
        <Icon className="h-5 w-5" />
      </span>
    )}
    <p className="text-sm font-medium text-secondary-700">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-xs text-secondary-400">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* ── Data list ──────────────────────────────────────────────────────────── */

/**
 * A table without Ant Design's table. Histories here are short, read-only and
 * never sorted, so a real table component is a lot of machinery — and its own
 * borders and paddings — for markup that only has to line up.
 */
export const DataList = ({
  head,
  children,
}: {
  head: { label: string; className?: string }[];
  children: React.ReactNode;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-secondary-100">
          {head.map((h, i) => (
            <th
              key={i}
              className={`whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-secondary-400 ${
                h.className || ""
              }`}
            >
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-secondary-50">{children}</tbody>
    </table>
  </div>
);

export const Td = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <td className={`px-3 py-3 align-middle ${className || ""}`}>{children}</td>
);
