import React from "react";

/**
 * Reusable Font Awesome icon.
 *
 * The admin loads the Font Awesome 7 CSS globally (see main.tsx), so we just
 * render the correct `<i>` classes. Use this instead of pasting unicode glyphs
 * (like ৳) that the UI font may not have.
 *
 *   <Icon name="bangladeshi-taka-sign" />
 *   <Icon name="trash" variant="regular" className="text-red-500" />
 */
interface IconProps {
  /** FA icon name WITHOUT the `fa-` prefix, e.g. "bangladeshi-taka-sign". */
  name: string;
  variant?: "solid" | "regular" | "light" | "brands";
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLElement>;
  title?: string;
}

const Icon: React.FC<IconProps> = ({
  name,
  variant = "solid",
  className = "",
  style,
  onClick,
  title,
}) => (
  <i
    className={`fa-${variant} fa-${name} ${className}`}
    style={style}
    onClick={onClick}
    title={title}
    aria-hidden="true"
  />
);

import { FaBangladeshiTakaSign } from "react-icons/fa6";

/**
 * Bangladeshi Taka (৳) — Using react-icons to ensure it doesn't clip
 * and scales perfectly with text.
 */
export const TakaIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => (
  <FaBangladeshiTakaSign 
    className={className} 
    style={{ display: "inline-block", verticalAlign: "middle", ...style }} 
  />
);

export default Icon;
