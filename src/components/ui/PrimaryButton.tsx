import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type PrimaryButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'default' | 'outline' | 'link' | 'white' | 'black';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  [key: string]: any;
};

const PrimaryButton: FC<PrimaryButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-xl shadow-md transition-all duration-300 inline-flex items-center justify-center';

  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'px-4 py-2 text-sm';
      break;
    case 'lg':
      sizeClasses = 'px-8 py-4 text-xl';
      break;
    case 'md':
    default:
      sizeClasses = 'px-6 py-[15px] text-lg';
      break;
  }

  let variantClasses = '';

  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-primary text-white hover:bg-primary/90 hover:!shadow-[0px_12px_40px_rgba(1,149,50,0.6)]';
      break;

    case 'default':
      variantClasses =
        'bg-secondary-200 text-secondary-900 hover:bg-secondary-300 hover:!shadow-[0px_12px_40px_rgba(0,0,11,0.09)]';
      break;

    case 'outline':
      variantClasses =
        'border border-primary text-primary hover:bg-primary hover:text-white hover:!shadow-[0px_12px_40px_rgba(1,149,50,0.6)]';
      break;

    case 'link':
      variantClasses =
        'text-primary hover:text-primary/80 bg-transparent shadow-none px-0 py-0';
      break;

    // ✅ NEW WHITE
    case 'white':
      variantClasses =
        'bg-white text-black border border-secondary-200 hover:bg-secondary-100 ';
      break;

    // ✅ NEW BLACK
    case 'black':
      variantClasses =
        'bg-black text-white hover:bg-black/80 border border-black hover:!shadow-[0px_12px_40px_rgba(0,0,0,0.6)]';
      break;

    default:
      variantClasses = '';
  }

  const isDisabled = disabled || loading;

  let disabledClasses = '';

  if (isDisabled) {
    disabledClasses =
      'bg-secondary-200 text-secondary-400 shadow-none cursor-not-allowed pointer-events-none border-none';
  }

  const combinedClasses = isDisabled
    ? `${baseClasses} ${sizeClasses} ${disabledClasses} ${className}`
    : `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`;

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  const content = loading ? (
    <span className="flex items-center gap-2">
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
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {children}
    </span>
  ) : (
    children
  );

  if (href) {
    return (
      <Link
        to={href}
        {...props}
        className={isDisabled ? 'pointer-events-none' : ''}
      >
        <button className={combinedClasses} disabled={isDisabled}>
          {content}
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
      {content}
    </button>
  );
};

export default PrimaryButton;
