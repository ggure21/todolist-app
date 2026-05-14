import type { Todo } from './todo.types';
import type { TodoFormValues } from './TodoForm';
import { TodoForm } from './TodoForm';
import { useUpdateTodo } from './useUpdateTodo';

interface EditTodoFormProps {
  todo: Todo;
  onCancel: () => void;
}

export function EditTodoForm({ todo, onCancel }: EditTodoFormProps) {
  const { mutate, isPending } = useUpdateTodo();

  const handleSubmit = (values: TodoFormValues) => {
    mutate(
      {
        id: todo.id,
        body: {
          title: values.title,
          category_id: values.category_id,
          description: values.description || null,
          due_date: values.due_date || null,
        },
      },
      {
        onSuccess: () => onCancel(),
      },
    );
  };

  return (
    <TodoForm
      initialValues={{
        title: todo.title,
        category_id: todo.category_id,
        description: todo.description ?? '',
        due_date: todo.due_date ?? '',
      }}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isPending={isPending}
      submitLabel="수정"
    />
  );
}
