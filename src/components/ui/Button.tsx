

import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "default" | "outline" | "link" | "custom";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: (e: any) => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  [key: string]: any;
};

const Button: FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const baseClasses =
    "font-medium rounded-xl shadow-md transition-all duration-300 inline-block";

  let sizeClasses = "";
  switch (size) {
    case "sm":
      sizeClasses = "px-4 py-2 text-sm";
      break;
    case "lg":
      sizeClasses = "px-8 py-4 text-xl";
      break;
    case "md":
    default:
      sizeClasses = "px-6 py-[15px] text-lg";
      break;
  }

  let variantClasses = "";

  switch (variant) {
    case "primary":
      variantClasses = "bg-primary text-white hover:bg-primary/90 shadow-md";
      break;
    case "default":
      variantClasses = "bg-secondary-200 text-secondary-900 hover:bg-secondary-300 shadow-sm";
      break;
    case "outline":
      variantClasses =
        "border border-primary text-primary  hover:text-primary hover:bg-primary hover:text-white";
      break;
    case "link":
      variantClasses =
        "text-primary underline hover:text-primary/80 bg-transparent shadow-none px-0 py-0";
      break;
    default:
      variantClasses = "";
  }

  const isDisabled = disabled || loading;

  let disabledClasses = "";
  if (loading) {
    switch (variant) {
      case "primary":
        disabledClasses =
          "bg-primary/50 text-white/80 shadow-none cursor-not-allowed pointer-events-none";
        break;
      case "default":
        disabledClasses =
          "bg-secondary-200 text-secondary-400 shadow-none cursor-not-allowed pointer-events-none";
        break;
      case "outline":
        disabledClasses =
          "border border-primary/50 text-primary/50 hover:text-white hover:bg-primary shadow-none cursor-not-allowed pointer-events-none";
        break;
      case "link":
        disabledClasses =
          "text-primary/50 underline shadow-none cursor-not-allowed pointer-events-none bg-transparent px-0 py-0";
        break;
      default:
        disabledClasses =
          "bg-primary/50 text-white/80 shadow-none cursor-not-allowed pointer-events-none";
    }
  }
  if (disabled) {
    switch (variant) {
      case "primary":
        disabledClasses =
          "bg-secondary-200 shadow-none text-secondary-300 cursor-not-allowed pointer-events-none";
        break;
      case "default":
        disabledClasses =
          "bg-secondary-200 shadow-none text-secondary-300 cursor-not-allowed pointer-events-none";
        break;
      case "outline":
        disabledClasses =
          "bg-secondary-200 shadow-none text-secondary-300 cursor-not-allowed pointer-events-none";
        break;
      case "link":
        disabledClasses =
          "bg-secondary-200 shadow-none text-secondary-300 cursor-not-allowed pointer-events-none";
        break;
      default:
        disabledClasses =
          "bg-secondary-200 shadow-none text-secondary-300 cursor-not-allowed pointer-events-none";
    }
  }

  const combinedClasses = isDisabled
    ? `${baseClasses} ${sizeClasses} ${disabledClasses} ${className}`
    : `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`;

  const handleClick = (e: any) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  if (href) {
    return (
      <Link
        to={href}
        {...props}
        className={isDisabled ? "pointer-events-none" : ""}
      >
        <button className={combinedClasses} disabled={isDisabled}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {children}
            </span>
          ) : (
            children
          )}
        </button>
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={combinedClasses}
      disabled={isDisabled}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
