import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useCategories } from '../category/useCategories';
import { TodoCard } from './TodoCard';
import type { Todo } from './todo.types';
import { useTodos } from './useTodos';

interface TodoListProps {
  onEdit: (todo: Todo) => void;
}

export function TodoList({ onEdit }: TodoListProps) {
  const { data: todos, isLoading, isError } = useTodos();
  const { data: categories = [] } = useCategories();

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name;

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="로딩 중"
        className="flex items-center justify-center py-10 text-sm text-[var(--color-gray-500)]"
      >
        <span
          className="inline-block w-5 h-5 border-2 border-[var(--color-primary-600)] border-t-transparent rounded-full animate-spin mr-2"
          aria-hidden="true"
        />
        불러오는 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-3">
        <ErrorMessage message="할일 목록을 불러오지 못했습니다." />
      </div>
    );
  }

  if (!todos?.length) {
    return <EmptyState />;
  }

  return (
    <div role="list" aria-label="할일 목록">
      {todos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          categoryName={getCategoryName(todo.category_id)}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
