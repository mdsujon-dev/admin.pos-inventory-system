import { HTMLAttributes } from "react";

interface InputErrorProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

const InputError = ({ children, ...rest }: InputErrorProps) => {
  return (
    <span {...rest} className="text-red block" style={{ fontSize: "13px" }}>
      {children}
    </span>
  );
};

export default InputError;
