import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { todoApi } from '../../api/todo.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';
import { useFilterStore } from '../../stores/filterStore';

export function useTodos() {
  const filters = useFilterStore(
    useShallow((s) => ({
      category_id: s.category_id,
      is_completed: s.is_completed,
      overdue: s.overdue,
    }))
  );

  return useQuery({
    queryKey: QUERY_KEYS.todos.filtered(filters),
    queryFn: () => todoApi.getTodos(filters),
  });
}
