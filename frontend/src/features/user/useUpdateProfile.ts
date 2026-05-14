import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api/user.api';
import { QUERY_KEYS } from '../../constants/queryKeys.constants';
import type { UpdateUserRequest } from './user.types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateUserRequest) => userApi.updateProfile(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
    },
  });
}
