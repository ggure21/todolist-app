import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWrapper } from '../../test/renderWithProviders';
import { useRegister } from './useRegister';

vi.mock('../../api/auth.api', () => ({
  authApi: {
    register: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { authApi } from '../../api/auth.api';
const mockAuthApi = authApi as unknown as { register: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('useRegister', () => {
  it('회원가입 성공 시 /login으로 이동한다', async () => {
    mockAuthApi.register.mockResolvedValueOnce({ message: '회원가입이 완료되었습니다' });

    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    act(() => {
      result.current.register({ email: 'new@example.com', password: 'password1', name: '홍길동' });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('회원가입 실패 시 isError가 true가 된다', async () => {
    mockAuthApi.register.mockRejectedValueOnce(new Error('이미 사용 중인 이메일입니다'));

    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    act(() => {
      result.current.register({ email: 'dup@example.com', password: 'password1', name: '홍길동' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('회원가입 중에는 isPending이 true이다', async () => {
    let resolve!: (v: { message: string }) => void;
    mockAuthApi.register.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    act(() => {
      result.current.register({ email: 'new@example.com', password: 'password1', name: '홍길동' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => resolve({ message: '완료' }));
  });

  it('반환 객체에 register, isPending, error, isError가 있다', () => {
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
