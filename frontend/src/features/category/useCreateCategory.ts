import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../../api/category.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';
import type { CreateCategoryRequest } from './category.types';

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateCategoryRequest) => categoryApi.createCategory(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories.all });
    },
  });
}
