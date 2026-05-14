import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import type { RegisterRequest } from './auth.types';

export function useRegister() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: () => {
      void navigate('/login');
    },
  });

  return {
    register: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
