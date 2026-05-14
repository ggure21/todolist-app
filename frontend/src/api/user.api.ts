import type { UpdateUserRequest, UserProfile } from '../features/user/user.types';
import { api } from './client';

export const userApi = {
  getMe: (): Promise<UserProfile> =>
    api.get('/api/users/me'),

  updateProfile: (body: UpdateUserRequest): Promise<UserProfile> =>
    api.patch('/api/users/me', body),
};
