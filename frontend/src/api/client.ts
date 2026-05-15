import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  constructor(statusCode: number, message: string, code: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    throw new ApiError(401, '인증이 필요합니다', 'UNAUTHORIZED');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: '요청 처리 중 오류가 발생했습니다', code: 'UNKNOWN' }));
    throw new ApiError(response.status, body.message ?? '오류가 발생했습니다', body.code ?? 'UNKNOWN');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
