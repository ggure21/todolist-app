'use strict';

jest.mock('../../../src/repositories/category.repository');

const categoryRepository = require('../../../src/repositories/category.repository');
const { createCategory } = require('../../../src/services/category.service');
const AppError = require('../../../src/utils/app-error');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const NEW_CAT = {
  id: 'new-cat-uuid',
  user_id: USER_ID,
  name: '운동',
  is_default: false,
  created_at: new Date(),
};

describe('categoryService.createCategory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create and return the new category when name is unique', async () => {
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

  it('should throw AppError(400, CATEGORY_NAME_DUPLICATE) when name already exists', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce({ id: 'existing' });

    await expect(createCategory(USER_ID, '운동'))
      .rejects.toMatchObject({ statusCode: 400, code: 'CATEGORY_NAME_DUPLICATE' });

    expect(categoryRepository.insertCategory).not.toHaveBeenCalled();
  });

  it('should throw an AppError instance on duplicate', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce({ id: 'existing' });

    await expect(createCategory(USER_ID, '운동')).rejects.toBeInstanceOf(AppError);
  });

  it('should check uniqueness scoped to the userId (not other users)', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce(undefined);
    categoryRepository.insertCategory.mockResolvedValueOnce(NEW_CAT);

    await createCategory(USER_ID, '운동');

    const [calledUserId] = categoryRepository.findByUserIdAndName.mock.calls[0];
    expect(calledUserId).toBe(USER_ID);
  });
});
