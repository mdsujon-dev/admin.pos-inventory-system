import { motion } from "framer-motion";
import React from "react";

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ElementType;
  accent: string;
  loading?: boolean;
  onClick?: () => void;
}

/** 
 * A headline number in its own colour, with an optional caption under it. 
 * This is the signature glassmorphism card originally used in the Dashboard.
 */
export const MetricCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  loading,
  onClick,
}: MetricCardProps) => {
  if (loading) {
    return (
      <div
        className="h-[92px] animate-pulse rounded-xl border-[1.5px] border-white/50 backdrop-blur-md"
        style={{
          background: `linear-gradient(135deg, ${accent}14 0%, rgba(255,255,255,0.7) 100%)`,
        }}
      />
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border-[1.5px] border-white/50 backdrop-blur-md shadow-[0_10px_28px_-12px_rgba(16,24,40,.3)] p-4 transition-all duration-300 hover:shadow-[0_14px_32px_-12px_rgba(16,24,40,.4)] hover:border-white/80 ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{
        background: `linear-gradient(135deg, ${accent}1a 0%, ${accent}08 42%, rgba(255,255,255,0.7) 100%)`,
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
