import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWrapper } from '../../test/renderWithProviders';
import { useDeleteTodo } from './useDeleteTodo';

vi.mock('../../api/todo.api', () => ({
  todoApi: {
    deleteTodo: vi.fn(),
  },
}));

import { todoApi } from '../../api/todo.api';
const mockTodoApi = todoApi as { deleteTodo: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('useDeleteTodo', () => {
  it('deleteTodo 호출 후 성공 시 isSuccess가 true이다', async () => {
    mockTodoApi.deleteTodo.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockTodoApi.deleteTodo).toHaveBeenCalledWith('1');
  });

  it('삭제 실패 시 isError가 true이다', async () => {
    mockTodoApi.deleteTodo.mockRejectedValueOnce(new Error('삭제 실패'));

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('삭제 중에는 isPending이 true이다', async () => {
    let resolve!: (v: unknown) => void;
    mockTodoApi.deleteTodo.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => resolve(undefined));
  });

  it('반환 객체에 mutate, isPending, isError가 있다', () => {
    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() });
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
