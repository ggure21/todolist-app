import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { TodoFormValues } from './TodoForm';
import { TodoForm } from './TodoForm';
import { useCreateTodo } from './useCreateTodo';

export function CreateTodoForm() {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate, isPending } = useCreateTodo();

  const handleSubmit = (values: TodoFormValues) => {
    mutate(
      {
        title: values.title,
        category_id: values.category_id,
        description: values.description || undefined,
        due_date: values.due_date || undefined,
      },
      {
        onSuccess: () => setIsOpen(false),
      },
    );
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-[var(--color-primary-600)] border border-dashed border-[var(--color-primary-600)] rounded-md hover:bg-[var(--color-primary-50)] transition-colors"
        aria-label="할일 추가"
      >
        <Plus size={21} aria-hidden="true" />
        할일 추가
      </button>
    );
  }

  return (
    <div className="border border-[var(--color-border)] rounded-md p-4 bg-[var(--color-bg-base)]">
      <TodoForm
        onSubmit={handleSubmit}
        onCancel={() => setIsOpen(false)}
        isPending={isPending}
      />
    </div>
  );
}
