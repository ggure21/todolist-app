import type {
  CreateTodoRequest,
  Todo,
  TodoFilters,
  ToggleTodoCompleteRequest,
  UpdateTodoRequest,
} from '../features/todo/todo.types';
import { api } from './client';

function buildTodoQueryString(filters?: TodoFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.category_id != null) params.set('category_id', filters.category_id);
  if (filters.is_completed != null) params.set('is_completed', String(filters.is_completed));
  if (filters.overdue != null) params.set('overdue', String(filters.overdue));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const todoApi = {
  getTodos: (filters?: TodoFilters): Promise<Todo[]> =>
    api.get(`/api/todos${buildTodoQueryString(filters)}`),

  createTodo: (body: CreateTodoRequest): Promise<Todo> =>
    api.post('/api/todos', body),

  updateTodo: (id: string, body: UpdateTodoRequest): Promise<Todo> =>
    api.patch(`/api/todos/${id}`, body),

  deleteTodo: (id: string): Promise<{ message: string }> =>
    api.delete(`/api/todos/${id}`),

  toggleTodoComplete: (id: string, body: ToggleTodoCompleteRequest): Promise<Todo> =>
    api.patch(`/api/todos/${id}/complete`, body),
};
