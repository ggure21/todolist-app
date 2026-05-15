import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from './client';
import { authApi } from './auth.api';

vi.mock('./client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  ApiError: class ApiError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, message: string, code: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  },
}));

const mockApi = client.api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('authApi.register', () => {
  it('POST /api/auth/register를 호출한다', async () => {
    mockApi.post.mockResolvedValueOnce({ message: '회원가입이 완료되었습니다' });
    const body = { email: 'test@example.com', password: 'password1', name: '홍길동' };

    const result = await authApi.register(body);

    expect(mockApi.post).toHaveBeenCalledWith('/api/auth/register', body);
    expect(result).toEqual({ message: '회원가입이 완료되었습니다' });
  });
});

describe('authApi.login', () => {
  it('POST /api/auth/login을 호출하고 accessToken을 반환한다', async () => {
    mockApi.post.mockResolvedValueOnce({ accessToken: 'jwt-token' });
    const body = { email: 'test@example.com', password: 'password1' };

    const result = await authApi.login(body);

    expect(mockApi.post).toHaveBeenCalledWith('/api/auth/login', body);
    expect(result.accessToken).toBe('jwt-token');
  });
});
