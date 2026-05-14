import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { createWrapper } from '../../test/renderWithProviders';
import { useCreateCategory } from './useCreateCategory';

vi.mock('../../api/category.api', () => ({
  categoryApi: {
    createCategory: vi.fn(),
  },
}));

import { categoryApi } from '../../api/category.api';
const mockCategoryApi = categoryApi as { createCategory: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

const newCategory = {
  id: '4',
  user_id: 'u1',
  name: '독서',
  is_default: false,
  created_at: '2024-01-02T00:00:00Z',
};

describe('useCreateCategory', () => {
  it('createCategory 호출 후 성공 시 isSuccess가 true이다', async () => {
    mockCategoryApi.createCategory.mockResolvedValueOnce(newCategory);

    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ name: '독서' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCategoryApi.createCategory).toHaveBeenCalledWith({ name: '독서' });
  });

  it('중복 이름 에러(BR-C-04) 시 isError가 true이고 error가 설정된다', async () => {
    const dupError = new ApiError(400, '이미 사용 중인 카테고리 이름입니다', 'DUPLICATE_CATEGORY');
    mockCategoryApi.createCategory.mockRejectedValueOnce(dupError);

    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ name: '개인' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(dupError);
  });

  it('일반 에러 시 isError가 true이다', async () => {
    mockCategoryApi.createCategory.mockRejectedValueOnce(new Error('서버 오류'));

    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ name: '새 카테고리' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('생성 중에는 isPending이 true이다', async () => {
    let resolve!: (v: unknown) => void;
    mockCategoryApi.createCategory.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ name: '독서' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => resolve(newCategory));
  });

  it('반환 객체에 mutate, isPending, isError, error가 있다', () => {
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
    expect('error' in result.current).toBe(true);
  });
});
