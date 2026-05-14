import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../../api/todo.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';
import type { Todo } from './todo.types';

export function useToggleTodoComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_completed }: { id: string; is_completed: boolean }) =>
      todoApi.toggleTodoComplete(id, { is_completed }),

    onMutate: async ({ id, is_completed }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.todos.all });

      const previousData = queryClient.getQueriesData<Todo[]>({ queryKey: QUERY_KEYS.todos.all });

      queryClient.setQueriesData<Todo[]>({ queryKey: QUERY_KEYS.todos.all }, (old) => {
        if (!old) return old;
        return old.map((todo) =>
          todo.id === id
            ? { ...todo, is_completed, completed_at: is_completed ? new Date().toISOString() : null }
            : todo,
        );
      });

      return { previousData };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos.all });
    },
  });
}
