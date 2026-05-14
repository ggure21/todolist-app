'use strict';

jest.mock('../../../src/repositories/todo.repository');
jest.mock('../../../src/repositories/category.repository');

const todoRepository = require('../../../src/repositories/todo.repository');
const categoryRepository = require('../../../src/repositories/category.repository');
const { createTodo } = require('../../../src/services/todo.service');
const AppError = require('../../../src/utils/app-error');

const USER_ID = 'user-uuid-001';
const DEFAULT_CAT = { id: 'cat-default', user_id: null, name: '업무', is_default: true };
const USER_CAT = { id: 'cat-user', user_id: USER_ID, name: '운동', is_default: false };
const OTHER_CAT = { id: 'cat-other', user_id: 'other-user', name: '비공개', is_default: false };

const NEW_TODO = {
  id: 'todo-uuid-001',
  user_id: USER_ID,
  category_id: DEFAULT_CAT.id,
  title: '보고서 작성',
  description: null,
  due_date: null,
  is_completed: false,
  completed_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('todoService.createTodo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create todo using a default category (BR-C-02)', async () => {
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);
    todoRepository.insertTodo.mockResolvedValueOnce(NEW_TODO);

    const result = await createTodo(USER_ID, { title: '보고서 작성', category_id: DEFAULT_CAT.id });

    expect(todoRepository.insertTodo).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ category_id: DEFAULT_CAT.id }));
    expect(result).toEqual(NEW_TODO);
  });

  it('should create todo using own user category', async () => {
    categoryRepository.findById.mockResolvedValueOnce(USER_CAT);
    todoRepository.insertTodo.mockResolvedValueOnce({ ...NEW_TODO, category_id: USER_CAT.id });

    const result = await createTodo(USER_ID, { title: '운동하기', category_id: USER_CAT.id });

    expect(result.category_id).toBe(USER_CAT.id);
  });

  it('should throw AppError(404, CATEGORY_NOT_FOUND) when category does not exist', async () => {
    categoryRepository.findById.mockResolvedValueOnce(undefined);

    await expect(createTodo(USER_ID, { title: '할일', category_id: 'nonexistent' }))
      .rejects.toMatchObject({ statusCode: 404, code: 'CATEGORY_NOT_FOUND' });

    expect(todoRepository.insertTodo).not.toHaveBeenCalled();
  });

  it('should throw AppError(403, CATEGORY_ACCESS_FORBIDDEN) when category belongs to other user', async () => {
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT);

    await expect(createTodo(USER_ID, { title: '할일', category_id: OTHER_CAT.id }))
      .rejects.toMatchObject({ statusCode: 403, code: 'CATEGORY_ACCESS_FORBIDDEN' });

    expect(todoRepository.insertTodo).not.toHaveBeenCalled();
  });

  it('should pass optional fields (description, due_date) to repository', async () => {
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);
    todoRepository.insertTodo.mockResolvedValueOnce(NEW_TODO);

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

  it('should throw AppError instance on access error', async () => {
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT);
    await expect(createTodo(USER_ID, { title: '할일', category_id: OTHER_CAT.id }))
      .rejects.toBeInstanceOf(AppError);
  });
});
