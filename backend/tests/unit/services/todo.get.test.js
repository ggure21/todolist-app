'use strict';

jest.mock('../../../src/repositories/todo.repository');
jest.mock('../../../src/repositories/category.repository');

const todoRepository = require('../../../src/repositories/todo.repository');
const { getTodos } = require('../../../src/services/todo.service');

const USER_ID = 'user-uuid-001';

function makeTodo(overrides = {}) {
  return {
    id: 'todo-uuid-001',
    user_id: USER_ID,
    category_id: 'cat-uuid-001',
    title: '할일',
    description: null,
    due_date: null,
    is_completed: false,
    completed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('todoService.getTodos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all todos for user when no filters', async () => {
    const todos = [makeTodo(), makeTodo({ id: 'todo-2' })];
    todoRepository.findByUserId.mockResolvedValueOnce(todos);

    const result = await getTodos(USER_ID, {});

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(USER_ID, {});
    expect(result).toHaveLength(2);
  });

  it('should pass categoryId filter when category_id query param is provided', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { category_id: 'cat-uuid-001' });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID, { categoryId: 'cat-uuid-001' },
    );
  });

  it('should convert is_completed="true" string to boolean true', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { is_completed: 'true' });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID, { isCompleted: true },
    );
  });

  it('should convert is_completed="false" string to boolean false', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { is_completed: 'false' });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID, { isCompleted: false },
    );
  });

  it('should pass overdue=true filter when overdue="true" is provided', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { overdue: 'true' });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID, { overdue: true },
    );
  });

  it('should apply multiple filters simultaneously (BR-F-04)', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { category_id: 'cat-1', is_completed: 'false', overdue: 'true' });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(USER_ID, {
      categoryId: 'cat-1',
      isCompleted: false,
      overdue: true,
    });
  });

  it('should return empty array when no todos match', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    const result = await getTodos(USER_ID, {});

    expect(result).toEqual([]);
  });
});
