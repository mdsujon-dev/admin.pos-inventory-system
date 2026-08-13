import { Card } from "antd";
import { Check, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

/**
 * The chrome the product form is built from.
 *
 * Split out because the form itself is already long, and none of this holds
 * state or knows what a product is — it is the panel's brand green applied
 * consistently to headings, choices and read-outs.
 */

/** A card with a brand-tinted header and an icon badge, so sections scan. */
export const SectionCard = ({
  icon: Icon,
  title,
  subtitle,
  extra,
  children,
}: {
  /** Optional: some panels read better as a plain heading. */
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  children: ReactNode;
}) => (
  <Card
    className="!rounded-xl !border-secondary-100 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
    styles={{
      header: {
        background:
          "linear-gradient(90deg, rgba(1,149,50,0.07) 0%, rgba(9,174,64,0.02) 45%, rgba(255,255,255,0) 100%)",
        borderBottom: "1px solid rgba(1,149,50,0.15)",
        padding: "10px 20px",
        minHeight: 0,
      },
    }}
    title={
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-primary">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-secondary-800">
            {title}
          </span>
          {subtitle && (
            <span className="block truncate text-xs font-normal text-secondary-500">
              {subtitle}
            </span>
          )}
        </span>
      </div>
    }
    extra={extra}
  >
    {children}
  </Card>
);

export type Tone = "brand" | "danger" | "muted";

const TONES: Record<Tone, { box: string; badge: string; value: string }> = {
  brand: {
    box: "border-primary-100 bg-primary-50/70",
    badge: "bg-primary text-white",
    value: "text-primary-700",
  },
  danger: {
    box: "border-danger/20 bg-danger/5",
    badge: "bg-danger text-white",
    value: "text-danger",
  },
  muted: {
    box: "border-secondary-100 bg-secondary-50",
    badge: "bg-secondary-200 text-secondary-600",
    value: "text-secondary-800",
  },
};

/**
 * One read-out in the pricing strip.
 *
 * Tone carries the meaning: a negative margin is not a styling choice, it is
 * the one thing on this screen worth interrupting someone for.
 */
export const StatTile = ({
  icon: Icon,
  label,
  tone = "brand",
  children,
  note,
}: {
  icon: LucideIcon;
  label: string;
  tone?: Tone;
  children: ReactNode;
  note?: ReactNode;
}) => {
  const styles = TONES[tone];
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${styles.box}`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${styles.badge}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-secondary-500">
          {label}
        </p>
        <p
          className={`truncate text-[15px] font-semibold leading-tight ${styles.value}`}
        >
          {children}
        </p>
        {note && (
          <p className="truncate text-[11px] text-secondary-500">{note}</p>
        )}
      </div>
    </div>
  );
};

export interface TypeOption {
  value: string;
  icon: LucideIcon;
  title: string;
  hint: string;
}

/**
 * The product type, as two cards rather than a pair of radio buttons.
 *
 * The choice decides which half of the form appears and cannot be changed
 * after creation, so it is worth more than two words of label — each card says
 * what it commits you to.
 *
 * `value` and `onChange` are injected by the surrounding Form.Item.
 */
export const TypePicker = ({
  options,
  value,
  onChange,
  disabled,
}: {
  options: TypeOption[];
  value?: string;
  onChange?: (next: string) => void;
  disabled?: boolean;
}) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
    {options.map((option) => {
      const active = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(option.value)}
          className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
            active
              ? "border-primary bg-primary-50 shadow-[0_2px_10px_-2px_rgba(1,149,50,0.35)]"
              : "border-secondary-100 bg-white hover:border-primary-300 hover:bg-primary-50/40"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors ${
              active
                ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white"
                : "bg-secondary-50 text-secondary-400 group-hover:bg-primary-100 group-hover:text-primary"
            }`}
          >
            <option.icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block text-sm font-semibold ${
                active ? "text-primary-700" : "text-secondary-800"
              }`}
            >
              {option.title}
            </span>
            <span className="block text-xs leading-snug text-secondary-500">
              {option.hint}
            </span>
          </span>
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${
              active
                ? "border-primary bg-primary text-white"
                : "border-secondary-200 text-transparent"
            }`}
          >
            <Check className="h-3 w-3" />
          </span>
        </button>
      );
    })}
  </div>
);
