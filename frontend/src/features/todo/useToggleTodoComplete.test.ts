import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWrapper } from '../../test/renderWithProviders';
import { useToggleTodoComplete } from './useToggleTodoComplete';

vi.mock('../../api/todo.api', () => ({
  todoApi: {
    toggleTodoComplete: vi.fn(),
  },
}));

import { todoApi } from '../../api/todo.api';
const mockTodoApi = todoApi as { toggleTodoComplete: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

const toggledTodo = {
  id: '1',
  user_id: 'u1',
  category_id: 'c1',
  title: '할일',
  description: null,
  due_date: null,
  is_completed: true,
  completed_at: '2024-01-02T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

describe('useToggleTodoComplete', () => {
  it('toggleTodoComplete 호출 후 성공 시 isSuccess가 true이다', async () => {
    mockTodoApi.toggleTodoComplete.mockResolvedValueOnce(toggledTodo);

    const { result } = renderHook(() => useToggleTodoComplete(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: '1', is_completed: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockTodoApi.toggleTodoComplete).toHaveBeenCalledWith('1', { is_completed: true });
  });

  it('토글 실패 시 isError가 true이다', async () => {
    mockTodoApi.toggleTodoComplete.mockRejectedValueOnce(new Error('토글 실패'));

    const { result } = renderHook(() => useToggleTodoComplete(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: '1', is_completed: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('토글 중에는 isPending이 true이다', async () => {
    let resolve!: (v: unknown) => void;
    mockTodoApi.toggleTodoComplete.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useToggleTodoComplete(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: '1', is_completed: true });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => resolve(toggledTodo));
  });

  it('반환 객체에 mutate, isPending, isError가 있다', () => {
    const { result } = renderHook(() => useToggleTodoComplete(), { wrapper: createWrapper() });
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
