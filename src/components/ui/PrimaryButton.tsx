import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type PrimaryButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'default' | 'outline' | 'link' | 'white' | 'black';
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
  href,
  onClick,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-xl px-6 py-3 text-lg shadow-md transition-all duration-300 inline-flex items-center justify-center';

  let variantClasses = '';

  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-gradient-to-br from-primary from-0% via-primary-600 via-[70%] to-primary-800 to-[100%] text-white hover:bg-primary/90 hover:!shadow-[0px_12px_40px_rgba(53,173,11,0.6)]';
      break;

    case 'default':
      variantClasses =
        'bg-gray-200 text-gray-900 hover:bg-gray-300 hover:!shadow-[0px_12px_40px_rgba(0,0,11,0.09)]';
      break;

    case 'outline':
      variantClasses =
        'border border-primary text-primary hover:bg-primary hover:text-white hover:!shadow-[0px_12px_40px_rgba(53,173,11,0.6)]';
      break;

    case 'link':
      variantClasses =
        'text-primary hover:text-primary/80 bg-transparent shadow-none px-0 py-0';
      break;

    // ✅ NEW WHITE
    case 'white':
      variantClasses =
        'bg-white text-black border border-gray-200 hover:bg-gray-100 ';
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
      'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed pointer-events-none border-none';
  }

  const combinedClasses = isDisabled
    ? `${baseClasses} ${disabledClasses} ${className}`
    : `${baseClasses} ${variantClasses} ${className}`;

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
        href={href}
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
