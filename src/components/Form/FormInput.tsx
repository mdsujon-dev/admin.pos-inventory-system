import { Form, Input } from "antd";
import { Rule } from "antd/es/form";
import type { NamePath } from "antd/es/form/interface";
import { InputProps } from "antd/es/input";

interface FormInputProps extends InputProps {
  name: NamePath;
  label?: React.ReactNode;
  rules?: Rule[];
  placeholder?: string;
  fieldError?: Record<string, string>;
  setFieldError?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  initialValue?: any;
  className?: string;
  fieldKey?: number | string;
  isListField?: boolean;
  help?: React.ReactNode;
  /** When true, digits are stripped as the user types (text-only field). */
  textOnly?: boolean;
  /**
   * The mirror of `textOnly`: everything but digits is stripped.
   *
   * For phone and account numbers. Deliberately not `type="number"`, which
   * drops the leading zero every Bangladeshi mobile number starts with and
   * hangs a spinner off a field nobody wants to increment.
   */
  digitsOnly?: boolean;
  tooltip?: React.ReactNode;
}

export const FormInput = ({
  name,
  label,
  rules,
  placeholder,
  fieldError = {},
  setFieldError = () => {},
  size = "middle",
  initialValue,
  className,
  fieldKey,
  isListField,
  help,
  textOnly,
  digitsOnly,
  tooltip,
  ...rest
}: FormInputProps) => {
  const errorMessage = fieldError?.[name as string];

  return (
    <Form.Item
      name={name}
      label={label}
      rules={rules}
      initialValue={initialValue}
      className={className}
      fieldKey={fieldKey}
      isListField={isListField}
      validateStatus={errorMessage ? 'error' : undefined}
      help={errorMessage || help}
      tooltip={tooltip}
      getValueFromEvent={
        textOnly
          ? (e) => (e?.target?.value ?? "").replace(/[0-9]/g, "")
          : digitsOnly
          ? (e) => (e?.target?.value ?? "").replace(/\D/g, "")
          : undefined
      }
    >
      <Input
        size={size}
        placeholder={placeholder}
        onChange={(e) => {
          setFieldError?.((prev) => ({ ...prev, [name as string]: "" }));
          if (rest.onChange) rest.onChange(e);
        }}
        {...rest}
      />
    </Form.Item>
  );
};
