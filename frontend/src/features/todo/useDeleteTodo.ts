import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../../api/todo.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => todoApi.deleteTodo(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos.all });
    },
  });
}
