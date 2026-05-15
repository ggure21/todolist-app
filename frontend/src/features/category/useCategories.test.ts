import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWrapper } from '../../test/renderWithProviders';
import { useCategories } from './useCategories';

vi.mock('../../api/category.api', () => ({
  categoryApi: {
    getCategories: vi.fn(),
  },
}));

let mockAccessToken: string | null = 'mock-token';

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
  ),
}));

import { categoryApi } from '../../api/category.api';
const mockCategoryApi = categoryApi as unknown as { getCategories: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
  mockAccessToken = 'mock-token';
});

const mockCategories = [
  { id: '1', user_id: null, name: '개인', is_default: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '2', user_id: null, name: '업무', is_default: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '3', user_id: 'u1', name: '쇼핑', is_default: false, created_at: '2024-01-01T00:00:00Z' },
];

describe('useCategories', () => {
  it('getCategories를 호출하고 데이터를 반환한다', async () => {
    mockCategoryApi.getCategories.mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(mockCategoryApi.getCategories).toHaveBeenCalledTimes(1);
  });

  it('로딩 중에는 isLoading이 true이다', async () => {
    mockCategoryApi.getCategories.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  it('API 실패 시 isError가 true이다', async () => {
    mockCategoryApi.getCategories.mockRejectedValueOnce(new Error('서버 오류'));

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('accessToken이 없으면 쿼리가 비활성화된다', () => {
    mockAccessToken = null;

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockCategoryApi.getCategories).not.toHaveBeenCalled();
  });

  it('반환 객체에 data, isLoading, isError가 있다', async () => {
    mockCategoryApi.getCategories.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect('data' in result.current).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
