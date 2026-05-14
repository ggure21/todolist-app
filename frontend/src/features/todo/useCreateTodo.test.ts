import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWrapper } from '../../test/renderWithProviders';
import { useCreateTodo } from './useCreateTodo';

vi.mock('../../api/todo.api', () => ({
  todoApi: {
    createTodo: vi.fn(),
  },
}));

import { todoApi } from '../../api/todo.api';
const mockTodoApi = todoApi as { createTodo: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

const newTodo = {
  id: '1',
  user_id: 'u1',
  category_id: 'c1',
  title: '새 할일',
  description: null,
  due_date: null,
  is_completed: false,
  completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('useCreateTodo', () => {
  it('createTodo 호출 후 성공 시 isSuccess가 true이다', async () => {
    mockTodoApi.createTodo.mockResolvedValueOnce(newTodo);

    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ title: '새 할일', category_id: 'c1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('생성 실패 시 isError가 true이다', async () => {
    mockTodoApi.createTodo.mockRejectedValueOnce(new Error('생성 실패'));

    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ title: '새 할일', category_id: 'c1' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('생성 중에는 isPending이 true이다', async () => {
    let resolve!: (v: unknown) => void;
    mockTodoApi.createTodo.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ title: '새 할일', category_id: 'c1' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => resolve(newTodo));
  });

  it('반환 객체에 mutate, isPending, isError가 있다', () => {
    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() });
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
});
