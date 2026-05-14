'use strict';

jest.mock('../../../src/repositories/todo.repository');
jest.mock('../../../src/repositories/category.repository');

const todoRepository = require('../../../src/repositories/todo.repository');
const categoryRepository = require('../../../src/repositories/category.repository');
const { updateTodo } = require('../../../src/services/todo.service');
const AppError = require('../../../src/utils/app-error');

const USER_ID = 'user-uuid-001';
const OTHER_ID = 'other-uuid-999';
const TODO_ID = 'todo-uuid-001';
const DEFAULT_CAT = { id: 'cat-default', user_id: null, name: '업무', is_default: true };
const USER_CAT = { id: 'cat-user', user_id: USER_ID, name: '운동', is_default: false };
const OTHER_CAT = { id: 'cat-other', user_id: OTHER_ID, name: '비공개', is_default: false };

function makeTodo(overrides = {}) {
  return {
    id: TODO_ID,
    user_id: USER_ID,
    category_id: DEFAULT_CAT.id,
    title: '기존 할일',
    description: null,
    due_date: null,
    is_completed: false,
    completed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('todoService.updateTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update todo title successfully', async () => {
    const existing = makeTodo();
    const updated = makeTodo({ title: '수정된 할일' });
    todoRepository.findById.mockResolvedValueOnce(existing);
    todoRepository.updateTodo.mockResolvedValueOnce(updated);

    const result = await updateTodo(USER_ID, TODO_ID, { title: '수정된 할일' });

    expect(todoRepository.updateTodo).toHaveBeenCalledWith(TODO_ID, { title: '수정된 할일' });
    expect(result.title).toBe('수정된 할일');
  });

  it('should update category_id after assertCategoryAccess passes', async () => {
    const existing = makeTodo();
    const updated = makeTodo({ category_id: USER_CAT.id });
    todoRepository.findById.mockResolvedValueOnce(existing);
    categoryRepository.findById.mockResolvedValueOnce(USER_CAT);
    todoRepository.updateTodo.mockResolvedValueOnce(updated);

    const result = await updateTodo(USER_ID, TODO_ID, { category_id: USER_CAT.id });

    expect(categoryRepository.findById).toHaveBeenCalledWith(USER_CAT.id);
    expect(result.category_id).toBe(USER_CAT.id);
  });

  it('should update using default category', async () => {
    const existing = makeTodo();
    const updated = makeTodo({ category_id: DEFAULT_CAT.id });
    todoRepository.findById.mockResolvedValueOnce(existing);
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);
    todoRepository.updateTodo.mockResolvedValueOnce(updated);

    const result = await updateTodo(USER_ID, TODO_ID, { category_id: DEFAULT_CAT.id });

    expect(result.category_id).toBe(DEFAULT_CAT.id);
  });

  it('should throw AppError(404, TODO_NOT_FOUND) when todo does not exist', async () => {
    todoRepository.findById.mockResolvedValueOnce(undefined);

    await expect(updateTodo(USER_ID, 'nonexistent', { title: '수정' }))
      .rejects.toMatchObject({ statusCode: 404, code: 'TODO_NOT_FOUND' });

    expect(todoRepository.updateTodo).not.toHaveBeenCalled();
  });

  it('should throw AppError(403, FORBIDDEN) when todo belongs to other user (BR-T-03)', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    await expect(updateTodo(USER_ID, TODO_ID, { title: '수정' }))
      .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });

    expect(todoRepository.updateTodo).not.toHaveBeenCalled();
  });

  it('should throw AppError(403, FORBIDDEN) instance on ownership violation', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    await expect(updateTodo(USER_ID, TODO_ID, { title: '수정' }))
      .rejects.toBeInstanceOf(AppError);
  });

  it('should throw AppError(404, CATEGORY_NOT_FOUND) when new category does not exist', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    categoryRepository.findById.mockResolvedValueOnce(undefined);

    await expect(updateTodo(USER_ID, TODO_ID, { category_id: 'nonexistent' }))
      .rejects.toMatchObject({ statusCode: 404, code: 'CATEGORY_NOT_FOUND' });

    expect(todoRepository.updateTodo).not.toHaveBeenCalled();
  });

  it('should throw AppError(403, CATEGORY_ACCESS_FORBIDDEN) when new category belongs to other user (BR-C-02)', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT);

    await expect(updateTodo(USER_ID, TODO_ID, { category_id: OTHER_CAT.id }))
      .rejects.toMatchObject({ statusCode: 403, code: 'CATEGORY_ACCESS_FORBIDDEN' });

    expect(todoRepository.updateTodo).not.toHaveBeenCalled();
  });

  it('should not call assertCategoryAccess when category_id is not in updates', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    todoRepository.updateTodo.mockResolvedValueOnce(makeTodo({ title: '수정' }));

    await updateTodo(USER_ID, TODO_ID, { title: '수정' });

    expect(categoryRepository.findById).not.toHaveBeenCalled();
  });

  it('should return existing todo when updateTodo returns null/undefined', async () => {
    const existing = makeTodo();
    todoRepository.findById.mockResolvedValueOnce(existing);
    todoRepository.updateTodo.mockResolvedValueOnce(null);

    const result = await updateTodo(USER_ID, TODO_ID, { title: '수정' });

    expect(result).toEqual(existing);
  });
});
