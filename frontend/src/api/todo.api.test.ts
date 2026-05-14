import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from './client';
import { todoApi } from './todo.api';

vi.mock('./client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockApi = client.api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('todoApi.getTodos', () => {
  it('필터 없이 GET /api/todos를 호출한다', async () => {
    mockApi.get.mockResolvedValueOnce([]);
    await todoApi.getTodos();
    expect(mockApi.get).toHaveBeenCalledWith('/api/todos');
  });

  it('category_id 필터를 쿼리스트링으로 전달한다', async () => {
    mockApi.get.mockResolvedValueOnce([]);
    await todoApi.getTodos({ category_id: 'cat-1' });
    expect(mockApi.get).toHaveBeenCalledWith('/api/todos?category_id=cat-1');
  });

  it('is_completed 필터를 쿼리스트링으로 전달한다', async () => {
    mockApi.get.mockResolvedValueOnce([]);
    await todoApi.getTodos({ is_completed: false });
    expect(mockApi.get).toHaveBeenCalledWith('/api/todos?is_completed=false');
  });

  it('overdue 필터를 쿼리스트링으로 전달한다', async () => {
    mockApi.get.mockResolvedValueOnce([]);
    await todoApi.getTodos({ overdue: true });
    expect(mockApi.get).toHaveBeenCalledWith('/api/todos?overdue=true');
  });

  it('복수 필터를 AND 조건으로 전달한다 (BR-F-04)', async () => {
    mockApi.get.mockResolvedValueOnce([]);
    await todoApi.getTodos({ category_id: 'cat-1', is_completed: false, overdue: true });
    const url = mockApi.get.mock.calls[0]?.[0] as string;
    expect(url).toContain('category_id=cat-1');
    expect(url).toContain('is_completed=false');
    expect(url).toContain('overdue=true');
  });

  it('null 값 필터는 쿼리스트링에 포함하지 않는다', async () => {
    mockApi.get.mockResolvedValueOnce([]);
    await todoApi.getTodos({ category_id: null, is_completed: null });
    expect(mockApi.get).toHaveBeenCalledWith('/api/todos');
  });
});

describe('todoApi.createTodo', () => {
  it('POST /api/todos를 호출한다', async () => {
    const todo = { id: '1', title: '새 할일', category_id: 'cat-1', user_id: 'u1', description: null, due_date: null, is_completed: false, completed_at: null, created_at: '', updated_at: '' };
    mockApi.post.mockResolvedValueOnce(todo);
    const body = { title: '새 할일', category_id: 'cat-1' };

    const result = await todoApi.createTodo(body);

    expect(mockApi.post).toHaveBeenCalledWith('/api/todos', body);
    expect(result.title).toBe('새 할일');
  });
});

describe('todoApi.updateTodo', () => {
  it('PATCH /api/todos/:id를 호출한다', async () => {
    mockApi.patch.mockResolvedValueOnce({});
    await todoApi.updateTodo('todo-1', { title: '수정된 제목' });
    expect(mockApi.patch).toHaveBeenCalledWith('/api/todos/todo-1', { title: '수정된 제목' });
  });
});

describe('todoApi.deleteTodo', () => {
  it('DELETE /api/todos/:id를 호출한다', async () => {
    mockApi.delete.mockResolvedValueOnce({ message: '할일이 삭제되었습니다' });
    await todoApi.deleteTodo('todo-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/todos/todo-1');
  });
});

describe('todoApi.toggleTodoComplete', () => {
  it('PATCH /api/todos/:id/complete를 호출한다 (BR-T-04)', async () => {
    mockApi.patch.mockResolvedValueOnce({});
    await todoApi.toggleTodoComplete('todo-1', { is_completed: true });
    expect(mockApi.patch).toHaveBeenCalledWith('/api/todos/todo-1/complete', { is_completed: true });
  });

  it('미완료 복원도 처리한다 (BR-T-05)', async () => {
    mockApi.patch.mockResolvedValueOnce({});
    await todoApi.toggleTodoComplete('todo-1', { is_completed: false });
    expect(mockApi.patch).toHaveBeenCalledWith('/api/todos/todo-1/complete', { is_completed: false });
  });
});
