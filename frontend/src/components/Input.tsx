import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-[var(--color-gray-700)]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={[
          'w-full h-9 px-3 rounded-md text-sm text-[var(--color-gray-900)]',
          'border bg-[var(--color-bg-base)] outline-none transition-colors',
          'placeholder:text-[var(--color-gray-500)]',
          'focus:border-[var(--color-border-focus)] focus:shadow-[0_0_0_3px_rgba(3,199,90,0.12)]',
          'disabled:bg-[var(--color-gray-100)] disabled:text-[var(--color-gray-300)] disabled:cursor-not-allowed',
          error
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-gray-200)]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-xs text-[var(--color-danger)] mt-0.5"
        >
          {error}
        </span>
      )}
    </div>
  );
}
