import { Form, Select } from "antd";
import { Rule } from "antd/es/form";
import { NamePath } from "antd/es/form/interface";
import { SelectProps } from "antd/es/select";
import { ReactNode } from "react";
import InputError from "./InputError";

interface FormSelectProps extends SelectProps<any> {
  name: NamePath;
  label?: ReactNode;
  rules?: Rule[];
  placeholder?: string;
  fieldError?: Record<string, string>;
  setFieldError?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** Hint under the field, the way `FormInput` already offers one. */
  help?: ReactNode;
  /** Tooltip next to the label */
  tooltip?: ReactNode;
}

export const FormSelect = ({
  name,
  label,
  rules,
  placeholder,
  allowClear = true,
  size = "middle",
  fieldError = {},
  setFieldError = () => {},
  help,
  tooltip,
  ...rest
}: FormSelectProps) => {
  return (
    <Form.Item name={name} label={label} rules={rules} help={help} tooltip={tooltip}>
      <Select
        size={size}
        placeholder={placeholder}
        allowClear={allowClear}
        onChange={() => setFieldError?.((prev) => ({ ...prev, [name as string]: "" }))}
        getPopupContainer={(trigger: any) => trigger.parentNode}
        {...rest}
      />
      {fieldError?.[name] && <InputError>{fieldError[name]}</InputError>}
    </Form.Item>
  );
};
