'use strict';

jest.mock('../../../src/repositories/todo.repository');
jest.mock('../../../src/repositories/category.repository');

const todoRepository = require('../../../src/repositories/todo.repository');
const { deleteTodo } = require('../../../src/services/todo.service');
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

describe('todoService.deleteTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should delete todo successfully', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    todoRepository.deleteById.mockResolvedValueOnce(undefined);

    await expect(deleteTodo(USER_ID, TODO_ID)).resolves.toBeUndefined();
    expect(todoRepository.deleteById).toHaveBeenCalledWith(TODO_ID);
  });

  it('should throw AppError(404, TODO_NOT_FOUND) when todo does not exist', async () => {
    todoRepository.findById.mockResolvedValueOnce(undefined);

    await expect(deleteTodo(USER_ID, 'nonexistent'))
      .rejects.toMatchObject({ statusCode: 404, code: 'TODO_NOT_FOUND' });

    expect(todoRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should throw AppError(403, FORBIDDEN) when todo belongs to other user (BR-T-03)', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    await expect(deleteTodo(USER_ID, TODO_ID))
      .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });

    expect(todoRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should throw AppError instance on ownership violation', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    await expect(deleteTodo(USER_ID, TODO_ID))
      .rejects.toBeInstanceOf(AppError);
  });
});
