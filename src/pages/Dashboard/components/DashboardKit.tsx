import { motion } from "framer-motion";
import React from "react";

import { riseIn } from "./dashboardMotion";

/**
 * The two shells every dashboard on this system is built from.
 *
 * They started life inside the trainer's dashboard and moved here the moment
 * the office's dashboard wanted the same look: two copies of a card is two
 * places to change a colour, and the copy nobody remembers is the one that
 * drifts. Both take a single `accent` and derive the wash, the border, the
 * label and the chip's glow from it — one colour per card, not four decisions.
 *
 * This file exports components only. `riseIn` lives in `dashboardMotion.ts`
 * because mixing components and plain values in one module costs Vite's fast
 * refresh — it falls back to reloading the page on every edit.
 */

/** A headline number in its own colour, with an optional caption under it. */
export const Metric = ({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  loading,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ElementType;
  accent: string;
  loading?: boolean;
  onClick?: () => void;
}) => {
  if (loading) {
    return (
      <div
        className="h-[92px] animate-pulse rounded-xl border"
        style={{
          background: `linear-gradient(135deg, ${accent}14 0%, #ffffff 100%)`,
          borderColor: `${accent}26`,
        }}
      />
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-[0_10px_28px_-12px_rgba(16,24,40,.3)] ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{
        background: `linear-gradient(135deg, ${accent}1a 0%, ${accent}08 42%, #ffffff 100%)`,
        borderColor: `${accent}33`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-25 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div className="relative flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
          style={{ background: accent }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: accent }}
          >
            {label}
          </p>
          <p className="mt-0.5 truncate text-[26px] font-bold leading-none text-secondary-900">
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-[11px] text-secondary-400">
              {hint}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * A panel with a coloured header and a white body.
 *
 * The tint lives in the header only: it makes a panel identifiable from across
 * the page, while everything that has to be *read* — names, numbers, bars —
 * sits on white with nothing competing against it.
 */
export const Section = ({
  title,
  subtitle,
  icon: Icon,
  accent = "#019532",
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) => (
  <motion.section
    variants={riseIn}
    className={`overflow-hidden rounded-xl border border-secondary-100 bg-white transition-all duration-300 hover:border-secondary-200 hover:shadow-sm ${
      className || ""
    }`}
  >
    <header
      className="flex items-center gap-3 border-b px-4 py-3"
      style={{
        background: `linear-gradient(90deg, ${accent}1f 0%, ${accent}0a 55%, transparent 100%)`,
        borderBottomColor: `${accent}2e`,
      }}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white shadow-sm"
        style={{ background: accent, boxShadow: `0 4px 12px -4px ${accent}80` }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold leading-tight text-secondary-900">
          {title}
        </h3>
        {subtitle && (
          <p className="truncate text-xs text-secondary-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </header>
    <div className={bodyClassName ?? "p-4"}>{children}</div>
  </motion.section>
);

/** The skeleton a `Section` shows while its data is in flight. */
export const SectionSkeleton = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} animate-pulse rounded-xl border border-secondary-100 bg-white`}
  />
);
