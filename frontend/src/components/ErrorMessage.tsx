interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p
      role="alert"
      className="text-sm text-[var(--color-danger)] mt-1"
    >
      {message}
    </p>
  );
}
