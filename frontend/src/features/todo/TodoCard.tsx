import { AlertCircle, Pencil, Trash2 } from 'lucide-react';
import type { Todo } from './todo.types';
import { useDeleteTodo } from './useDeleteTodo';
import { useToggleTodoComplete } from './useToggleTodoComplete';
import { formatDate, isOverdue } from '../../utils/date.utils';

interface TodoCardProps {
  todo: Todo;
  categoryName?: string | undefined;
  onEdit?: (todo: Todo) => void;
}

export function TodoCard({ todo, categoryName, onEdit }: TodoCardProps) {
  const { mutate: toggleComplete, isPending: isToggling } = useToggleTodoComplete();
  const { mutate: deleteTodo, isPending: isDeleting } = useDeleteTodo();

  const overdue = !todo.is_completed && isOverdue(todo.due_date);
  const formattedDate = formatDate(todo.due_date);

  const handleToggle = () => {
    toggleComplete({ id: todo.id, is_completed: !todo.is_completed });
  };

  const handleDelete = () => {
    if (window.confirm('이 할일을 삭제하시겠습니까?')) {
      deleteTodo(todo.id);
    }
  };

  return (
    <article
      className={[
        'flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border)] transition-colors',
        todo.is_completed
          ? 'bg-[var(--color-gray-50)]'
          : overdue
          ? 'bg-[var(--color-danger-light)]'
          : 'bg-[var(--color-bg-base)] hover:bg-[var(--color-primary-50)]',
      ].join(' ')}
      aria-label={`할일: ${todo.title}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={isToggling}
        aria-label={todo.is_completed ? '완료 취소' : '완료로 표시'}
        aria-pressed={todo.is_completed}
        className={[
          'mt-0.5 w-[23px] h-[23px] flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors',
          todo.is_completed
            ? 'bg-[var(--color-primary-600)] border-[var(--color-primary-600)]'
            : 'border-[var(--color-gray-300)] hover:border-[var(--color-primary-600)]',
          isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {todo.is_completed && (
          <span
            aria-hidden="true"
            className="block w-3 h-[8px] border-l-2 border-b-2 border-white -rotate-45 -translate-y-px"
          />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-sm',
            todo.is_completed
              ? 'line-through text-[var(--color-gray-300)]'
              : 'text-[var(--color-gray-900)]',
          ].join(' ')}
        >
          {todo.title}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {categoryName && (
            <span
              className={[
                'inline-flex items-center px-2 py-0.5 rounded-full text-[14px] font-medium',
                todo.is_completed
                  ? 'line-through bg-[var(--color-gray-100)] text-[var(--color-gray-300)]'
                  : 'bg-[var(--color-primary-100)] text-[var(--color-primary-600)]',
              ].join(' ')}
            >
              {categoryName}
            </span>
          )}

          <span
            className={[
              'flex items-center gap-0.5 text-xs',
              overdue
                ? 'font-medium text-[var(--color-danger)]'
                : todo.is_completed
                ? 'line-through text-[var(--color-gray-300)]'
                : 'text-[var(--color-gray-500)]',
            ].join(' ')}
          >
            {overdue && <AlertCircle size={16} aria-hidden="true" />}
            {overdue ? `${formattedDate} (초과)` : formattedDate}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(todo)}
            aria-label={`${todo.title} 수정`}
            className="p-1.5 rounded text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)] transition-colors"
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`${todo.title} 삭제`}
          className="p-1.5 rounded text-[var(--color-gray-500)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors disabled:opacity-50"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
