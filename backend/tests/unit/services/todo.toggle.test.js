'use strict';

jest.mock('../../../src/repositories/todo.repository');
jest.mock('../../../src/repositories/category.repository');

const todoRepository = require('../../../src/repositories/todo.repository');
const { toggleTodo } = require('../../../src/services/todo.service');
const AppError = require('../../../src/utils/app-error');

const USER_ID = 'user-uuid-001';
const OTHER_ID = 'other-uuid-999';
const TODO_ID = 'todo-uuid-001';

function makeTodo(overrides = {}) {
  return {
    id: TODO_ID,
    user_id: USER_ID,
    category_id: 'cat-default',
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

describe('todoService.toggleTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should mark todo as completed and set completed_at (BR-T-04)', async () => {
    const existing = makeTodo({ is_completed: false });
    const completedAt = new Date().toISOString();
    const toggled = makeTodo({ is_completed: true, completed_at: completedAt });
    todoRepository.findById.mockResolvedValueOnce(existing);
    todoRepository.toggleComplete.mockResolvedValueOnce(toggled);

    const result = await toggleTodo(USER_ID, TODO_ID, true);

    expect(todoRepository.toggleComplete).toHaveBeenCalledWith(TODO_ID, true);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBe(completedAt);
  });

  it('should mark todo as incomplete and clear completed_at (BR-T-05)', async () => {
    const existing = makeTodo({ is_completed: true, completed_at: new Date().toISOString() });
    const toggled = makeTodo({ is_completed: false, completed_at: null });
    todoRepository.findById.mockResolvedValueOnce(existing);
    todoRepository.toggleComplete.mockResolvedValueOnce(toggled);

    const result = await toggleTodo(USER_ID, TODO_ID, false);

    expect(todoRepository.toggleComplete).toHaveBeenCalledWith(TODO_ID, false);
    expect(result.is_completed).toBe(false);
    expect(result.completed_at).toBeNull();
  });

  it('should throw AppError(404, TODO_NOT_FOUND) when todo does not exist', async () => {
    todoRepository.findById.mockResolvedValueOnce(undefined);

    await expect(toggleTodo(USER_ID, 'nonexistent', true))
      .rejects.toMatchObject({ statusCode: 404, code: 'TODO_NOT_FOUND' });

    expect(todoRepository.toggleComplete).not.toHaveBeenCalled();
  });

  it('should throw AppError(403, FORBIDDEN) when todo belongs to other user (BR-T-03)', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    await expect(toggleTodo(USER_ID, TODO_ID, true))
      .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });

    expect(todoRepository.toggleComplete).not.toHaveBeenCalled();
  });

  it('should throw AppError instance on ownership violation', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    await expect(toggleTodo(USER_ID, TODO_ID, true))
      .rejects.toBeInstanceOf(AppError);
  });
});
