import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../../api/todo.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';
import type { CreateTodoRequest } from './todo.types';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTodoRequest) => todoApi.createTodo(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos.all });
    },
  });
}
