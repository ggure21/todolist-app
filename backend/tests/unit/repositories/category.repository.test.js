'use strict';

// Mock the pg pool before requiring any modules that depend on it.
// db.js exports a Pool instance directly, so we mock the module to return
// a plain object whose `query` property is a jest.fn().
jest.mock('../../../src/config/db', () => ({
  query: jest.fn(),
}));

const pool = require('../../../src/config/db');
const categoryRepository = require('../../../src/repositories/category.repository');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a fake pg result object that mimics the shape returned by pool.query.
 * @param {Array}  rows
 * @param {number} rowCount
 */
function makePgResult(rows = [], rowCount = rows.length) {
  return { rows, rowCount };
}

/**
 * A realistic default (system) category row as it would come back from PostgreSQL.
 */
function makeDefaultCategoryRow(overrides = {}) {
  return {
    id: 'cat00000-0000-0000-0000-000000000001',
    user_id: null,
    name: 'Inbox',
    is_default: true,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/**
 * A realistic user-defined category row.
 */
function makeUserCategoryRow(overrides = {}) {
  return {
    id: 'cat00000-0000-0000-0000-000000000002',
    user_id: 'user0000-0000-0000-0000-000000000001',
    name: 'Work',
    is_default: false,
    created_at: new Date('2024-03-01T00:00:00.000Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = 'user0000-0000-0000-0000-000000000001';
const CATEGORY_ID = 'cat00000-0000-0000-0000-000000000002';
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('categoryRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findByUserIdAndDefault
  // -------------------------------------------------------------------------
  describe('findByUserIdAndDefault(userId)', () => {
    it('should return combined array of default and user-defined categories', async () => {
      const defaultCategory = makeDefaultCategoryRow();
      const userCategory = makeUserCategoryRow();
      pool.query.mockResolvedValueOnce(makePgResult([defaultCategory, userCategory]));

      const result = await categoryRepository.findByUserIdAndDefault(USER_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([USER_ID]),
      );
      expect(result).toEqual([defaultCategory, userCategory]);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no categories exist for the user', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([]));

      const result = await categoryRepository.findByUserIdAndDefault(USER_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  describe('findById(categoryId)', () => {
    it('should return the category row when the ID exists', async () => {
      const categoryRow = makeUserCategoryRow();
      pool.query.mockResolvedValueOnce(makePgResult([categoryRow]));

      const result = await categoryRepository.findById(CATEGORY_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [CATEGORY_ID],
      );
      expect(result).toEqual(categoryRow);
    });

    it('should return undefined when the ID does not exist', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([]));

      const result = await categoryRepository.findById(NONEXISTENT_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // findByUserIdAndName
  // -------------------------------------------------------------------------
  describe('findByUserIdAndName(userId, name)', () => {
    it('should return the category row when the name already exists for the user (duplicate)', async () => {
      const existingCategory = makeUserCategoryRow({ name: 'Work' });
      pool.query.mockResolvedValueOnce(makePgResult([existingCategory]));

      const result = await categoryRepository.findByUserIdAndName(USER_ID, 'Work');

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([USER_ID, 'Work']),
      );
      expect(result).toEqual(existingCategory);
    });

    it('should return undefined when no category with that name exists for the user (not a duplicate)', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([]));

      const result = await categoryRepository.findByUserIdAndName(USER_ID, 'Personal');

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // insertCategory
  // -------------------------------------------------------------------------
  describe('insertCategory(userId, name)', () => {
    it('should return the newly created category row on successful insertion', async () => {
      const newCategory = makeUserCategoryRow({ name: 'Hobby' });
      pool.query.mockResolvedValueOnce(makePgResult([newCategory]));

      const result = await categoryRepository.insertCategory(USER_ID, 'Hobby');

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([USER_ID, 'Hobby']),
      );
      expect(result).toEqual(newCategory);
    });

    it('should throw an error when a duplicate name violates unique constraint (code 23505)', async () => {
      const duplicateError = new Error(
        'duplicate key value violates unique constraint "uq_categories_user_id_name"',
      );
      duplicateError.code = '23505';
      pool.query.mockRejectedValueOnce(duplicateError);

      await expect(
        categoryRepository.insertCategory(USER_ID, 'Work'),
      ).rejects.toMatchObject({ code: '23505' });

      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // deleteById
  // -------------------------------------------------------------------------
  describe('deleteById(categoryId)', () => {
    it('should return rowCount 1 when the category is successfully deleted', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([], 1));

      const result = await categoryRepository.deleteById(CATEGORY_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [CATEGORY_ID],
      );
      expect(result).toBe(1);
    });

    it('should return rowCount 0 when the category ID does not exist', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([], 0));

      const result = await categoryRepository.deleteById(NONEXISTENT_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // countTodosByCategory
  // -------------------------------------------------------------------------
  describe('countTodosByCategory(categoryId)', () => {
    it('should return 3 (Number) when the category has 3 todos', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([{ count: '3' }]));

      const result = await categoryRepository.countTodosByCategory(CATEGORY_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [CATEGORY_ID],
      );
      expect(result).toBe(3);
      expect(typeof result).toBe('number');
    });

    it('should return 0 (Number) when the category has no todos', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([{ count: '0' }]));

      const result = await categoryRepository.countTodosByCategory(CATEGORY_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(0);
      expect(typeof result).toBe('number');
    });
  });
});
