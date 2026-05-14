import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from './client';
import { userApi } from './user.api';

vi.mock('./client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockApi = client.api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('userApi.getMe', () => {
  it('GET /api/users/me를 호출한다', async () => {
    const profile = { id: 'u1', email: 'test@example.com', name: '홍길동', created_at: '', updated_at: '' };
    mockApi.get.mockResolvedValueOnce(profile);

    const result = await userApi.getMe();

    expect(mockApi.get).toHaveBeenCalledWith('/api/users/me');
    expect(result.email).toBe('test@example.com');
  });
});

describe('userApi.updateProfile', () => {
  it('PATCH /api/users/me를 호출한다 (이름 변경)', async () => {
    mockApi.patch.mockResolvedValueOnce({ id: 'u1', email: 'test@example.com', name: '새이름', created_at: '', updated_at: '' });

    await userApi.updateProfile({ name: '새이름' });

    expect(mockApi.patch).toHaveBeenCalledWith('/api/users/me', { name: '새이름' });
  });

  it('비밀번호 변경 시 current_password와 new_password를 전달한다', async () => {
    mockApi.patch.mockResolvedValueOnce({});

    await userApi.updateProfile({ current_password: 'old123', new_password: 'new123!!' });

    expect(mockApi.patch).toHaveBeenCalledWith('/api/users/me', {
      current_password: 'old123',
      new_password: 'new123!!',
    });
  });
});
