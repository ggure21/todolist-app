import type { TodoFilters } from '../features/todo/todo.types';

export const QUERY_KEYS = {
  todos: {
    all: ['todos'] as const,
    filtered: (filters: TodoFilters) => ['todos', filters] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
} as const;
