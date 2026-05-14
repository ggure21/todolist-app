import { useState } from 'react';
import { Layout } from '../components/Layout';
import { CategoryList } from '../features/category/CategoryList';
import { CreateTodoForm } from '../features/todo/CreateTodoForm';
import { EditTodoForm } from '../features/todo/EditTodoForm';
import { FilterBar } from '../features/todo/FilterBar';
import { TodoList } from '../features/todo/TodoList';
import type { Todo } from '../features/todo/todo.types';

function TodoListPage() {
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  return (
    <Layout sidebar={<CategoryList />}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[var(--color-border)] flex-wrap">
          <FilterBar />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            {editingTodo ? (
              <EditTodoForm todo={editingTodo} onCancel={() => setEditingTodo(null)} />
            ) : (
              <CreateTodoForm />
            )}
          </div>

          <TodoList onEdit={setEditingTodo} />
        </div>
      </div>
    </Layout>
  );
}

export default TodoListPage;
