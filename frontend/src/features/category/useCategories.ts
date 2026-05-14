import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../../api/category.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';
import { useAuthStore } from '../../stores/authStore';

export function useCategories() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: QUERY_KEYS.categories.all,
    queryFn: () => categoryApi.getCategories(),
    staleTime: 1000 * 60,
    enabled: !!accessToken,
  });
}
