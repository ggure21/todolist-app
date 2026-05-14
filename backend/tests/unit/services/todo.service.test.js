'use strict';

jest.mock('../../../src/repositories/todo.repository');
jest.mock('../../../src/repositories/category.repository');

const todoRepository = require('../../../src/repositories/todo.repository');
const categoryRepository = require('../../../src/repositories/category.repository');
const {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  toggleTodo,
} = require('../../../src/services/todo.service');
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

// ============================================================
// createTodo
// ============================================================
describe('todoService.createTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create todo with default category', async () => {
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);
    todoRepository.insertTodo.mockResolvedValueOnce(makeTodo());

    const result = await createTodo(USER_ID, { title: '할일', category_id: DEFAULT_CAT.id });

    expect(todoRepository.insertTodo).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ category_id: DEFAULT_CAT.id }),
    );
    expect(result.title).toBe('할일');
  });

  it('should create todo with own user category', async () => {
    categoryRepository.findById.mockResolvedValueOnce(USER_CAT);
    todoRepository.insertTodo.mockResolvedValueOnce(makeTodo({ category_id: USER_CAT.id }));

    const result = await createTodo(USER_ID, { title: '운동하기', category_id: USER_CAT.id });

    expect(result.category_id).toBe(USER_CAT.id);
  });

  it('should throw AppError(404, CATEGORY_NOT_FOUND) when category does not exist', async () => {
    categoryRepository.findById.mockResolvedValueOnce(undefined);

    await expect(createTodo(USER_ID, { title: '할일', category_id: 'nonexistent' }))
      .rejects.toMatchObject({ statusCode: 404, code: 'CATEGORY_NOT_FOUND' });

    expect(todoRepository.insertTodo).not.toHaveBeenCalled();
  });

  it('should throw AppError(403, CATEGORY_ACCESS_FORBIDDEN) when category belongs to other user (BR-C-02)', async () => {
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT);

    await expect(createTodo(USER_ID, { title: '할일', category_id: OTHER_CAT.id }))
      .rejects.toMatchObject({ statusCode: 403, code: 'CATEGORY_ACCESS_FORBIDDEN' });

    expect(todoRepository.insertTodo).not.toHaveBeenCalled();
  });

  it('should pass optional fields to repository', async () => {
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);
    todoRepository.insertTodo.mockResolvedValueOnce(makeTodo());

    await createTodo(USER_ID, {
      title: '할일',
      category_id: DEFAULT_CAT.id,
      description: '상세 설명',
      due_date: '2030-12-31',
    });

    expect(todoRepository.insertTodo).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ description: '상세 설명', due_date: '2030-12-31' }),
    );
  });
});

// ============================================================
// getTodos
// ============================================================
describe('todoService.getTodos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all todos when no filters', async () => {
    const todos = [makeTodo(), makeTodo({ id: 'todo-2' })];
    todoRepository.findByUserId.mockResolvedValueOnce(todos);

    const result = await getTodos(USER_ID, {});

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(USER_ID, {});
    expect(result).toHaveLength(2);
  });

  it('should pass categoryId filter (BR-F-01)', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { category_id: DEFAULT_CAT.id });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ categoryId: DEFAULT_CAT.id }),
    );
  });

  it('should convert is_completed="true" string to boolean true (BR-F-03)', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { is_completed: 'true' });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ isCompleted: true }),
    );
  });

  it('should convert is_completed="false" string to boolean false', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { is_completed: 'false' });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ isCompleted: false }),
    );
  });

  it('should pass overdue=true filter (BR-F-02)', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await getTodos(USER_ID, { overdue: 'true' });

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ overdue: true }),
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

// ============================================================
// updateTodo
// ============================================================
describe('todoService.updateTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update todo title', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    todoRepository.updateTodo.mockResolvedValueOnce(makeTodo({ title: '수정됨' }));

    const result = await updateTodo(USER_ID, TODO_ID, { title: '수정됨' });

    expect(todoRepository.updateTodo).toHaveBeenCalledWith(TODO_ID, { title: '수정됨' });
    expect(result.title).toBe('수정됨');
  });

  it('should throw AppError(404, TODO_NOT_FOUND) when todo does not exist', async () => {
    todoRepository.findById.mockResolvedValueOnce(undefined);

    await expect(updateTodo(USER_ID, 'nonexistent', { title: '수정' }))
      .rejects.toMatchObject({ statusCode: 404, code: 'TODO_NOT_FOUND' });
  });

  it('should throw AppError(403, FORBIDDEN) when todo belongs to other user (BR-T-03)', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    await expect(updateTodo(USER_ID, TODO_ID, { title: '수정' }))
      .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });

    expect(todoRepository.updateTodo).not.toHaveBeenCalled();
  });

  it('should validate category access when category_id is updated (BR-C-02)', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT);

    await expect(updateTodo(USER_ID, TODO_ID, { category_id: OTHER_CAT.id }))
      .rejects.toMatchObject({ statusCode: 403, code: 'CATEGORY_ACCESS_FORBIDDEN' });
  });

  it('should not check category when category_id not in updates', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    todoRepository.updateTodo.mockResolvedValueOnce(makeTodo({ title: '수정' }));

    await updateTodo(USER_ID, TODO_ID, { title: '수정' });

    expect(categoryRepository.findById).not.toHaveBeenCalled();
  });
});

// ============================================================
// deleteTodo
// ============================================================
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
});

// ============================================================
// toggleTodo
// ============================================================
describe('todoService.toggleTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should mark todo as completed and set completed_at (BR-T-04)', async () => {
    const completedAt = new Date().toISOString();
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ is_completed: false }));
    todoRepository.toggleComplete.mockResolvedValueOnce(
      makeTodo({ is_completed: true, completed_at: completedAt }),
    );

    const result = await toggleTodo(USER_ID, TODO_ID, true);

    expect(todoRepository.toggleComplete).toHaveBeenCalledWith(TODO_ID, true);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBe(completedAt);
  });

  it('should mark todo as incomplete and clear completed_at (BR-T-05)', async () => {
    todoRepository.findById.mockResolvedValueOnce(
      makeTodo({ is_completed: true, completed_at: new Date().toISOString() }),
    );
    todoRepository.toggleComplete.mockResolvedValueOnce(
      makeTodo({ is_completed: false, completed_at: null }),
    );

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
    await expect(toggleTodo(USER_ID, TODO_ID, true)).rejects.toBeInstanceOf(AppError);
  });
});
