import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:cursor-not-allowed min-h-[44px]';

  const variants: Record<string, string> = {
    primary: [
      'bg-[var(--color-primary-600)] text-white border-0',
      'hover:bg-[var(--color-primary-500)]',
      'active:opacity-90',
      'disabled:bg-[var(--color-gray-300)]',
    ].join(' '),
    secondary: [
      'bg-transparent text-[var(--color-gray-700)] border border-[var(--color-gray-300)]',
      'hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-600)]',
      'disabled:opacity-50',
    ].join(' '),
    danger: [
      'bg-transparent text-[var(--color-danger)] border border-[var(--color-danger)]',
      'hover:bg-[var(--color-danger-light)]',
      'disabled:opacity-50',
    ].join(' '),
  };

  return (
    <button
      className={[base, variants[variant], 'px-4 py-2 text-sm', className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
