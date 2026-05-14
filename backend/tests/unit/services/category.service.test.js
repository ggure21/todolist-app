'use strict';

jest.mock('../../../src/repositories/category.repository');

const categoryRepository = require('../../../src/repositories/category.repository');
const { getCategories, createCategory, deleteCategory } = require('../../../src/services/category.service');
const AppError = require('../../../src/utils/app-error');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const OTHER_ID = 'other-uuid-999';

const DEFAULT_CATS = [
  { id: 'def-1', user_id: null, name: '개인', is_default: true, created_at: new Date() },
  { id: 'def-2', user_id: null, name: '업무', is_default: true, created_at: new Date() },
  { id: 'def-3', user_id: null, name: '쇼핑', is_default: true, created_at: new Date() },
];
const USER_CAT = { id: 'usr-1', user_id: 'user-uuid', name: '운동', is_default: false, created_at: new Date() };

describe('categoryService.getCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return combined default + user categories', async () => {
    categoryRepository.findByUserIdAndDefault.mockResolvedValueOnce([...DEFAULT_CATS, USER_CAT]);

    const result = await getCategories('user-uuid');

    expect(categoryRepository.findByUserIdAndDefault).toHaveBeenCalledWith('user-uuid');
    expect(result).toHaveLength(4);
  });

  it('should return only default categories when user has none', async () => {
    categoryRepository.findByUserIdAndDefault.mockResolvedValueOnce(DEFAULT_CATS);

    const result = await getCategories('user-uuid');

    expect(result).toHaveLength(3);
    expect(result.every(c => c.is_default)).toBe(true);
  });

  it('should include is_default field in every item', async () => {
    categoryRepository.findByUserIdAndDefault.mockResolvedValueOnce([...DEFAULT_CATS, USER_CAT]);

    const result = await getCategories('user-uuid');

    result.forEach(cat => expect(cat).toHaveProperty('is_default'));
  });

  it('should return empty array when repository returns empty', async () => {
    categoryRepository.findByUserIdAndDefault.mockResolvedValueOnce([]);

    const result = await getCategories('user-uuid');

    expect(result).toEqual([]);
  });
});

describe('categoryService.createCategory', () => {
  const NEW_CAT = { id: 'new-cat-uuid', user_id: USER_ID, name: '운동', is_default: false, created_at: new Date() };

  beforeEach(() => jest.clearAllMocks());

  it('should create and return category when name is unique', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce(undefined);
    categoryRepository.insertCategory.mockResolvedValueOnce(NEW_CAT);

    const result = await createCategory(USER_ID, '운동');

    expect(categoryRepository.findByUserIdAndName).toHaveBeenCalledWith(USER_ID, '운동');
    expect(categoryRepository.insertCategory).toHaveBeenCalledWith(USER_ID, '운동');
    expect(result).toEqual(NEW_CAT);
  });

  it('should return is_default=false for user-created category', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce(undefined);
    categoryRepository.insertCategory.mockResolvedValueOnce(NEW_CAT);

    const result = await createCategory(USER_ID, '운동');

    expect(result.is_default).toBe(false);
  });

  it('should throw AppError(400, CATEGORY_NAME_DUPLICATE) when name already exists (BR-C-04)', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce({ id: 'existing' });

    await expect(createCategory(USER_ID, '운동'))
      .rejects.toMatchObject({ statusCode: 400, code: 'CATEGORY_NAME_DUPLICATE' });

    expect(categoryRepository.insertCategory).not.toHaveBeenCalled();
  });

  it('should throw AppError instance on duplicate', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce({ id: 'existing' });
    await expect(createCategory(USER_ID, '운동')).rejects.toBeInstanceOf(AppError);
  });

  it('should scope uniqueness check to userId', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce(undefined);
    categoryRepository.insertCategory.mockResolvedValueOnce(NEW_CAT);

    await createCategory(USER_ID, '운동');

    const [calledUserId] = categoryRepository.findByUserIdAndName.mock.calls[0];
    expect(calledUserId).toBe(USER_ID);
  });
});

describe('categoryService.deleteCategory', () => {
  const USER_CAT_ROW = { id: 'cat-user', user_id: USER_ID, name: '운동', is_default: false, created_at: new Date() };
  const DEFAULT_CAT_ROW = { id: 'cat-def', user_id: null, name: '업무', is_default: true, created_at: new Date() };
  const OTHER_CAT_ROW = { id: 'cat-other', user_id: OTHER_ID, name: '비공개', is_default: false, created_at: new Date() };

  beforeEach(() => jest.clearAllMocks());

  it('should delete category successfully', async () => {
    categoryRepository.findById.mockResolvedValueOnce(USER_CAT_ROW);
    categoryRepository.countTodosByCategory.mockResolvedValueOnce(0);
    categoryRepository.deleteById.mockResolvedValueOnce(undefined);

    await expect(deleteCategory(USER_ID, USER_CAT_ROW.id)).resolves.toBeUndefined();
    expect(categoryRepository.deleteById).toHaveBeenCalledWith(USER_CAT_ROW.id);
  });

  it('should throw AppError(404, CATEGORY_NOT_FOUND) when category does not exist', async () => {
    categoryRepository.findById.mockResolvedValueOnce(undefined);

    await expect(deleteCategory(USER_ID, 'nonexistent'))
      .rejects.toMatchObject({ statusCode: 404, code: 'CATEGORY_NOT_FOUND' });
  });

  it('should throw AppError(400, DEFAULT_CATEGORY_DELETE_NOT_ALLOWED) for default category (BR-C-01)', async () => {
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT_ROW);

    await expect(deleteCategory(USER_ID, DEFAULT_CAT_ROW.id))
      .rejects.toMatchObject({ statusCode: 400, code: 'DEFAULT_CATEGORY_DELETE_NOT_ALLOWED' });

    expect(categoryRepository.deleteById).not.toHaveBeenCalled();
  });

  it('should throw AppError(403, FORBIDDEN) when category belongs to other user', async () => {
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT_ROW);

    await expect(deleteCategory(USER_ID, OTHER_CAT_ROW.id))
      .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('should throw AppError(400, CATEGORY_HAS_TODOS) when category has todos (BR-C-03)', async () => {
    categoryRepository.findById.mockResolvedValueOnce(USER_CAT_ROW);
    categoryRepository.countTodosByCategory.mockResolvedValueOnce(3);

    await expect(deleteCategory(USER_ID, USER_CAT_ROW.id))
      .rejects.toMatchObject({ statusCode: 400, code: 'CATEGORY_HAS_TODOS' });

    expect(categoryRepository.deleteById).not.toHaveBeenCalled();
  });
});
