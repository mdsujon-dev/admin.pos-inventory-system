import { Form } from "antd";
import { Rule } from "antd/es/form";
import type { NamePath } from "antd/es/form/interface";
import { TextAreaProps } from "antd/es/input";
import RichTextEditor from "../Common/RichEditor/RichTextEditor";
import InputError from "./InputError";

/** Plain visible text length (HTML tags removed); used for min/max validation. */
// eslint-disable-next-line react-refresh/only-export-components
export const plainTextLengthFromHtml = (html: string) =>
  String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .length;

interface FormTextareaProps extends TextAreaProps {
  name: NamePath;
  label?: string;
  rules?: Rule[];
  placeholder?: string;
  fieldError?: Record<string, string>;
  setFieldError?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** Optional: minimum plain-text length (HTML stripped). */
  minChars?: number;
  /** Optional: maximum plain-text length (HTML stripped). */
  maxChars?: number;
  /** Alias for `minChars`. */
  min?: number;
  /** Alias for `maxChars`. */
  max?: number;
}

function buildLengthRules(
  minChars?: number,
  maxChars?: number
): Rule[] {
  const out: Rule[] = [];
  if (typeof minChars === "number" && minChars > 0) {
    out.push({
      validator: (_, value) => {
        const len = plainTextLengthFromHtml(String(value ?? ""));
        if (len < minChars) {
          return Promise.reject(
            new Error(`At least ${minChars} characters required (plain text)`)
          );
        }
        return Promise.resolve();
      },
    });
  }
  if (typeof maxChars === "number" && maxChars > 0) {
    out.push({
      validator: (_, value) => {
        const len = plainTextLengthFromHtml(String(value ?? ""));
        if (len > maxChars) {
          return Promise.reject(
            new Error(`At most ${maxChars} characters allowed (plain text)`)
          );
        }
        return Promise.resolve();
      },
    });
  }
  return out;
}

export const FormTextarea = ({
  name,
  label,
  rules,
  placeholder,
  fieldError = {},
  setFieldError = () => {},
  minChars,
  maxChars,
  min,
  max,
  ...rest
}: FormTextareaProps) => {
  // Drop the DOM `onChange` from the spread — Form.Item injects the real
  // value/onChange into the editor, and the rich-text editor's onChange has a
  // different (value: string) signature.
  const { value, onChange: _onChange, ...textEditorProps } = rest;
  void _onChange;
  const mergedRules = [
    ...(rules ?? []),
    ...buildLengthRules(minChars ?? min, maxChars ?? max),
  ];

  return (
    <Form.Item name={name} label={label} rules={mergedRules}>
      <RichTextEditor
        placeholder={placeholder}
        value={typeof value === "string" ? value : value?.toString() || ""}
        onChange={() => setFieldError?.((prev) => ({ ...prev, [name]: "" }))}
        {...textEditorProps}
      />
      {fieldError?.[name] && <InputError>{fieldError[name]}</InputError>}
    </Form.Item>
  );
};
