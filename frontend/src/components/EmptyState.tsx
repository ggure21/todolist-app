import { ClipboardList } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = '할일이 없습니다',
  description = '새로운 할일을 추가하거나 필터를 변경해보세요.',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className="flex flex-col items-center justify-center py-10 px-6 text-center"
    >
      <ClipboardList
        size={62}
        className="text-[var(--color-gray-300)] mb-4"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-[var(--color-gray-500)] mb-2">
        {title}
      </p>
      <p className="text-xs text-[var(--color-gray-300)]">
        {description}
      </p>
    </div>
  );
}
