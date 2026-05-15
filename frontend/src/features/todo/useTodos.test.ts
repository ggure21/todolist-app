import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWrapper } from '../../test/renderWithProviders';
import { useTodos } from './useTodos';

vi.mock('../../api/todo.api', () => ({
  todoApi: {
    getTodos: vi.fn(),
  },
}));

vi.mock('../../stores/filterStore', () => ({
  useFilterStore: vi.fn((selector: (s: { category_id: null; is_completed: null; overdue: null }) => unknown) =>
    selector({ category_id: null, is_completed: null, overdue: null }),
  ),
}));

import { todoApi } from '../../api/todo.api';
const mockTodoApi = todoApi as unknown as { getTodos: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

const mockTodos = [
  {
    id: '1',
    user_id: 'u1',
    category_id: 'c1',
    title: '테스트 할일',
    description: null,
    due_date: null,
    is_completed: false,
    completed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('useTodos', () => {
  it('getTodos를 호출하고 데이터를 반환한다', async () => {
    mockTodoApi.getTodos.mockResolvedValueOnce(mockTodos);

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTodos);
    expect(mockTodoApi.getTodos).toHaveBeenCalledWith({
      category_id: null,
      is_completed: null,
      overdue: null,
    });
  });

  it('로딩 중에는 isLoading이 true이다', async () => {
    mockTodoApi.getTodos.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  it('API 실패 시 isError가 true이다', async () => {
    mockTodoApi.getTodos.mockRejectedValueOnce(new Error('서버 오류'));

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('반환 객체에 data, isLoading, isError가 있다', async () => {
    mockTodoApi.getTodos.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect('data' in result.current).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
