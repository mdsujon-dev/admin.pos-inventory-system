import { Input } from "antd";
import type { InputProps } from "antd";

/**
 * A real HTML number field.
 *
 * antd's `InputNumber` renders `type="text"` internally so it can format and
 * parse values, which means no numeric keypad on mobile. This is a plain
 * `type="number"` input instead — pair it with `normalize={toNumber}` on the
 * Form.Item so the form still stores a number rather than the string the DOM
 * hands back. The native stepper arrows are hidden globally in index.css.
 */
const NumberInput = ({ onFocus, ...props }: InputProps) => (
  <Input
    type="number"
    // Fields that default to 0 are the common case here (fees, discounts).
    // Without this, typing appends to the zero and you get 05000; selecting
    // on focus means the first keystroke simply replaces it.
    onFocus={(e) => {
      e.target.select();
      onFocus?.(e);
    }}
    {...props}
  />
);

export default NumberInput;
