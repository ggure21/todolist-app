import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { createWrapper } from '../../test/renderWithProviders';
import { useUpdateProfile } from './useUpdateProfile';

vi.mock('../../api/user.api', () => ({
  userApi: {
    updateProfile: vi.fn(),
  },
}));

import { userApi } from '../../api/user.api';
const mockUserApi = userApi as unknown as { updateProfile: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

const updatedProfile = {
  id: 'u1',
  email: 'user@example.com',
  name: '홍길동',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

describe('useUpdateProfile', () => {
  it('이름 수정 성공 시 isSuccess가 true이다', async () => {
    mockUserApi.updateProfile.mockResolvedValueOnce(updatedProfile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ name: '홍길동' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUserApi.updateProfile).toHaveBeenCalledWith({ name: '홍길동' });
  });

  it('비밀번호 수정 성공 시 isSuccess가 true이다', async () => {
    mockUserApi.updateProfile.mockResolvedValueOnce(updatedProfile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ current_password: 'oldpass', new_password: 'newpass1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUserApi.updateProfile).toHaveBeenCalledWith({
      current_password: 'oldpass',
      new_password: 'newpass1',
    });
  });

  it('현재 비밀번호 불일치 시 isError가 true이다', async () => {
    const authError = new ApiError(400, '현재 비밀번호가 올바르지 않습니다', 'INVALID_PASSWORD');
    mockUserApi.updateProfile.mockRejectedValueOnce(authError);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ current_password: 'wrongpass', new_password: 'newpass1' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(authError);
  });

  it('일반 에러 시 isError가 true이다', async () => {
    mockUserApi.updateProfile.mockRejectedValueOnce(new Error('서버 오류'));

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ name: '홍길동' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('수정 중에는 isPending이 true이다', async () => {
    let resolve!: (v: unknown) => void;
    mockUserApi.updateProfile.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ name: '홍길동' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => resolve(updatedProfile));
  });

  it('반환 객체에 mutate, isPending, isError, error가 있다', () => {
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
    expect('error' in result.current).toBe(true);
  });
});
