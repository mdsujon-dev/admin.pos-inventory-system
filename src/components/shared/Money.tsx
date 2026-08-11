import React from "react";
import { TakaIcon } from "./Icon";

/**
 * Renders a money amount with the Bangladeshi Taka icon (react-icons) instead
 * of the raw ৳ glyph — use this everywhere an amount is shown.
 *
 *   <Money value={1500} />   →   ৳ 1,500
 */
export const Money: React.FC<{ value?: number; className?: string }> = ({
  value,
  className,
}) => (
  <span className={`inline-flex items-center gap-0.5 ${className || ""}`}>
    <TakaIcon />
    {Number(value || 0).toLocaleString("en-BD")}
  </span>
);

export default Money;
