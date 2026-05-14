import type { AuthResponse, LoginRequest, RegisterRequest } from '../features/auth/auth.types';
import { api } from './client';

export const authApi = {
  register: (body: RegisterRequest): Promise<{ message: string }> =>
    api.post('/api/auth/register', body),

  login: (body: LoginRequest): Promise<AuthResponse> =>
    api.post('/api/auth/login', body),
};
