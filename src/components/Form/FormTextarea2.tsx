import { Form } from "antd";
import { Rule } from "antd/es/form";
import { NamePath } from "antd/es/form/interface";
import { TextAreaProps } from "antd/es/input";
import TextArea from "antd/es/input/TextArea";

interface FormTextarea2Props extends TextAreaProps {
  name: NamePath;
  label?: string;
  rows?: number;
  size?: "small" | "middle" | "large";
  rules?: Rule[];
  placeholder?: string;
  fieldError?: Record<string, string>;
  setFieldError?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fieldKey?: number | string;
  isListField?: boolean;
}

export const FormTextarea2 = ({
  name,
  label,
  rows,
  size,
  rules,
  placeholder,
  fieldError = {},
  setFieldError = () => {},
  fieldKey,
  isListField,
  ...rest
}: FormTextarea2Props) => {
  const errorMessage = fieldError?.[name as string];

  return (
    <Form.Item 
      name={name} 
      label={label} 
      rules={rules}
      fieldKey={fieldKey}
      isListField={isListField}
      validateStatus={errorMessage ? 'error' : undefined}
      help={errorMessage || undefined}
    >
      <TextArea
        rows={rows || 3}
        size={size || "large"}
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
