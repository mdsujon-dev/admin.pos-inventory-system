import React from "react";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // hex — colored top border + icon chip
  loading?: boolean;
}

/**
 * Compact KPI tile: a colored top accent border, solid accent icon chip, a
 * large value and a small caption. Flat (no shadow) to match the dashboard.
 */
const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  loading,
}) => {
  if (loading) {
    return (
      <div className="h-[68px] animate-pulse rounded-md border border-secondary-100 bg-white" />
    );
  }

  return (
    <div
      className="group rounded-md border border-secondary-100 bg-white px-4 py-3 shadow-sm transition-shadow duration-200 hover:shadow-card-hover"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold leading-tight tracking-tight text-secondary-900">
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 truncate text-[11px] font-medium text-secondary-400">
              {hint}
            </p>
          )}
        </div>
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-white"
          style={{ backgroundColor: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
