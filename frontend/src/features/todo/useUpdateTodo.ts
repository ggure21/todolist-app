import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../../api/todo.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';
import type { UpdateTodoRequest } from './todo.types';

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTodoRequest }) =>
      todoApi.updateTodo(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos.all });
    },
  });
}
