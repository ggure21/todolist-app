import { useQuery } from '@tanstack/react-query';
import { todoApi } from '../../api/todo.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';
import { useFilterStore } from '../../stores/filterStore';

export function useTodos() {
  const filters = useFilterStore((s) => ({
    category_id: s.category_id,
    is_completed: s.is_completed,
    overdue: s.overdue,
  }));

  return useQuery({
    queryKey: QUERY_KEYS.todos.filtered(filters),
    queryFn: () => todoApi.getTodos(filters),
  });
}
