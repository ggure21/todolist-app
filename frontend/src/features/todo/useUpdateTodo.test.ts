import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWrapper } from '../../test/renderWithProviders';
import { useUpdateTodo } from './useUpdateTodo';

vi.mock('../../api/todo.api', () => ({
  todoApi: {
    updateTodo: vi.fn(),
  },
}));

import { todoApi } from '../../api/todo.api';
const mockTodoApi = todoApi as unknown as { updateTodo: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

const updatedTodo = {
  id: '1',
  user_id: 'u1',
  category_id: 'c1',
  title: '수정된 할일',
  description: null,
  due_date: null,
  is_completed: false,
  completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

describe('useUpdateTodo', () => {
  it('updateTodo 호출 후 성공 시 isSuccess가 true이다', async () => {
    mockTodoApi.updateTodo.mockResolvedValueOnce(updatedTodo);

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: '1', body: { title: '수정된 할일' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockTodoApi.updateTodo).toHaveBeenCalledWith('1', { title: '수정된 할일' });
  });

  it('수정 실패 시 isError가 true이다', async () => {
    mockTodoApi.updateTodo.mockRejectedValueOnce(new Error('수정 실패'));

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: '1', body: { title: '수정된 할일' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('수정 중에는 isPending이 true이다', async () => {
    let resolve!: (v: unknown) => void;
    mockTodoApi.updateTodo.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: '1', body: { title: '수정된 할일' } });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => resolve(updatedTodo));
  });

  it('반환 객체에 mutate, isPending, isError가 있다', () => {
    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() });
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
