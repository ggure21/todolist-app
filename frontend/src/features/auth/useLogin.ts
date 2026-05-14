import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { decodeTokenUserId } from '../../utils/jwt.utils';
import type { LoginRequest } from './auth.types';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const mutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      const userId = decodeTokenUserId(data.accessToken);
      setAuth(data.accessToken, userId);
      void navigate('/');
    },
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
