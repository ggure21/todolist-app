import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../stores/authStore';
import { createWrapper } from '../../test/renderWithProviders';
import { useLogin } from './useLogin';

vi.mock('../../api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { authApi } from '../../api/auth.api';
const mockAuthApi = authApi as unknown as { login: ReturnType<typeof vi.fn> };

function makeJwt(userId: string) {
  const payload = btoa(JSON.stringify({ userId }));
  return `header.${payload}.sig`;
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, userId: null });
  vi.clearAllMocks();
});

describe('useLogin', () => {
  it('로그인 성공 시 setAuth를 호출하고 /로 이동한다', async () => {
    const token = makeJwt('user-123');
    mockAuthApi.login.mockResolvedValueOnce({ accessToken: token });

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    act(() => {
      result.current.login({ email: 'test@example.com', password: 'password1' });
    });

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe(token);
      expect(useAuthStore.getState().userId).toBe('user-123');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('로그인 실패 시 isError가 true가 된다', async () => {
    mockAuthApi.login.mockRejectedValueOnce(new Error('이메일 또는 비밀번호가 올바르지 않습니다'));

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    act(() => {
      result.current.login({ email: 'wrong@example.com', password: 'wrong' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('로그인 중에는 isPending이 true이다', async () => {
    let resolve!: (v: { accessToken: string }) => void;
    mockAuthApi.login.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    act(() => {
      result.current.login({ email: 'test@example.com', password: 'password1' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => resolve({ accessToken: makeJwt('u1') }));
  });

  it('반환 객체에 login, isPending, error, isError가 있다', () => {
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
