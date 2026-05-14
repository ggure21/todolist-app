'use strict';

// Mock the pg pool before requiring any modules that depend on it.
// db.js exports a Pool instance directly, so we mock the module to return
// a plain object whose `query` property is a jest.fn().
jest.mock('../../../src/config/db', () => ({
  query: jest.fn(),
}));

const pool = require('../../../src/config/db');
const todoRepository = require('../../../src/repositories/todo.repository');

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
 * A realistic todo row as it would come back from PostgreSQL.
 */
function makeTodoRow(overrides = {}) {
  return {
    id: 'todo0000-0000-0000-0000-000000000001',
    user_id: 'user0000-0000-0000-0000-000000000001',
    category_id: 'cat00000-0000-0000-0000-000000000001',
    title: 'Buy groceries',
    description: null,
    due_date: null,
    is_completed: false,
    completed_at: null,
    created_at: new Date('2024-06-01T00:00:00.000Z'),
    updated_at: new Date('2024-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = 'user0000-0000-0000-0000-000000000001';
const CATEGORY_ID = 'cat00000-0000-0000-0000-000000000001';
const TODO_ID = 'todo0000-0000-0000-0000-000000000001';
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('todoRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findByUserId
  // -------------------------------------------------------------------------
  describe('findByUserId(userId, filters)', () => {
    it('should return rows filtered by user_id only when no filters are provided', async () => {
      const rows = [makeTodoRow(), makeTodoRow({ id: 'todo0000-0000-0000-0000-000000000002', title: 'Read a book' })];
      pool.query.mockResolvedValueOnce(makePgResult(rows));

      const result = await todoRepository.findByUserId(USER_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/user_id/);
      expect(params).toContain(USER_ID);
      expect(result).toEqual(rows);
      expect(result).toHaveLength(2);
    });

    it('should include category_id condition when categoryId filter is provided', async () => {
      const rows = [makeTodoRow()];
      pool.query.mockResolvedValueOnce(makePgResult(rows));

      const result = await todoRepository.findByUserId(USER_ID, { categoryId: CATEGORY_ID });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/category_id/);
      expect(params).toContain(CATEGORY_ID);
      expect(result).toEqual(rows);
    });

    it('should include is_completed condition when isCompleted=false filter is provided', async () => {
      const rows = [makeTodoRow({ is_completed: false })];
      pool.query.mockResolvedValueOnce(makePgResult(rows));

      const result = await todoRepository.findByUserId(USER_ID, { isCompleted: false });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/is_completed/);
      expect(params).toContain(false);
      expect(result).toEqual(rows);
    });

    it('should include due_date < CURRENT_DATE condition when overdue=true filter is provided', async () => {
      const overdueRow = makeTodoRow({ due_date: new Date('2024-01-01'), is_completed: false });
      pool.query.mockResolvedValueOnce(makePgResult([overdueRow]));

      const result = await todoRepository.findByUserId(USER_ID, { overdue: true });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql] = pool.query.mock.calls[0];
      expect(sql).toMatch(/due_date\s*<\s*CURRENT_DATE/i);
      expect(result).toEqual([overdueRow]);
    });

    it('should include both category_id and is_completed conditions when both filters are provided', async () => {
      const rows = [makeTodoRow({ is_completed: true, completed_at: new Date('2024-06-02T00:00:00.000Z') })];
      pool.query.mockResolvedValueOnce(makePgResult(rows));

      const result = await todoRepository.findByUserId(USER_ID, {
        categoryId: CATEGORY_ID,
        isCompleted: true,
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/category_id/);
      expect(sql).toMatch(/is_completed/);
      expect(params).toContain(CATEGORY_ID);
      expect(params).toContain(true);
      expect(result).toEqual(rows);
    });

    it('should return an empty array when no todos match the query', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([]));

      const result = await todoRepository.findByUserId(USER_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  describe('findById(todoId)', () => {
    it('should return the todo row when the ID exists', async () => {
      const todoRow = makeTodoRow();
      pool.query.mockResolvedValueOnce(makePgResult([todoRow]));

      const result = await todoRepository.findById(TODO_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [TODO_ID],
      );
      expect(result).toEqual(todoRow);
    });

    it('should return undefined when the ID does not exist', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([]));

      const result = await todoRepository.findById(NONEXISTENT_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // insertTodo
  // -------------------------------------------------------------------------
  describe('insertTodo(userId, input)', () => {
    it('should return the newly created row when only required fields (title, category_id) are provided', async () => {
      const newTodo = makeTodoRow({ title: 'Prepare report' });
      pool.query.mockResolvedValueOnce(makePgResult([newTodo]));

      const result = await todoRepository.insertTodo(USER_ID, {
        category_id: CATEGORY_ID,
        title: 'Prepare report',
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/INSERT/i);
      expect(params).toContain(USER_ID);
      expect(params).toContain(CATEGORY_ID);
      expect(params).toContain('Prepare report');
      expect(result).toEqual(newTodo);
    });

    it('should return the newly created row when optional fields (description, due_date) are also provided', async () => {
      const dueDate = '2024-12-31';
      const newTodo = makeTodoRow({
        title: 'Exercise',
        description: 'Go for a run',
        due_date: new Date(dueDate),
      });
      pool.query.mockResolvedValueOnce(makePgResult([newTodo]));

      const result = await todoRepository.insertTodo(USER_ID, {
        category_id: CATEGORY_ID,
        title: 'Exercise',
        description: 'Go for a run',
        due_date: dueDate,
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/INSERT/i);
      expect(params).toContain('Go for a run');
      expect(params).toContain(dueDate);
      expect(result).toEqual(newTodo);
    });
  });

  // -------------------------------------------------------------------------
  // updateTodo
  // -------------------------------------------------------------------------
  describe('updateTodo(todoId, updates)', () => {
    it('should return the updated row when only title is updated', async () => {
      const updatedRow = makeTodoRow({ title: 'Updated title' });
      pool.query.mockResolvedValueOnce(makePgResult([updatedRow]));

      const result = await todoRepository.updateTodo(TODO_ID, { title: 'Updated title' });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/UPDATE/i);
      expect(params).toContain('Updated title');
      expect(params).toContain(TODO_ID);
      expect(result).toEqual(updatedRow);
    });

    it('should return the updated row when multiple fields are updated simultaneously', async () => {
      const dueDate = '2025-03-15';
      const updatedRow = makeTodoRow({
        title: 'New title',
        description: 'New description',
        due_date: new Date(dueDate),
        category_id: CATEGORY_ID,
      });
      pool.query.mockResolvedValueOnce(makePgResult([updatedRow]));

      const result = await todoRepository.updateTodo(TODO_ID, {
        title: 'New title',
        description: 'New description',
        due_date: dueDate,
        category_id: CATEGORY_ID,
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toMatch(/UPDATE/i);
      expect(params).toContain('New title');
      expect(params).toContain('New description');
      expect(params).toContain(dueDate);
      expect(params).toContain(CATEGORY_ID);
      expect(params).toContain(TODO_ID);
      expect(result).toEqual(updatedRow);
    });

    it('should return null without calling pool.query when updates is an empty object', async () => {
      const result = await todoRepository.updateTodo(TODO_ID, {});

      expect(pool.query).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // deleteById
  // -------------------------------------------------------------------------
  describe('deleteById(todoId)', () => {
    it('should return rowCount 1 when the todo is successfully deleted', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([], 1));

      const result = await todoRepository.deleteById(TODO_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [TODO_ID],
      );
      expect(result).toBe(1);
    });

    it('should return rowCount 0 when the todo ID does not exist', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([], 0));

      const result = await todoRepository.deleteById(NONEXISTENT_ID);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // toggleComplete
  // -------------------------------------------------------------------------
  describe('toggleComplete(todoId, isCompleted)', () => {
    it('should set is_completed=TRUE and completed_at=NOW() when isCompleted=true (BR-T-04)', async () => {
      const completedRow = makeTodoRow({
        is_completed: true,
        completed_at: new Date('2024-06-10T12:00:00.000Z'),
      });
      pool.query.mockResolvedValueOnce(makePgResult([completedRow]));

      const result = await todoRepository.toggleComplete(TODO_ID, true);

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      // isCompleted=true branch: SQL literals TRUE and NOW() are embedded directly
      expect(sql).toMatch(/is_completed\s*=\s*TRUE/i);
      expect(sql).toMatch(/completed_at\s*=\s*NOW\(\)/i);
      // Only todoId is bound as a parameter (isCompleted is a SQL literal, not a bound param)
      expect(params).toEqual([TODO_ID]);
      expect(result).toEqual(completedRow);
    });

    it('should set is_completed=FALSE and completed_at=NULL when isCompleted=false (BR-T-05)', async () => {
      const uncompletedRow = makeTodoRow({
        is_completed: false,
        completed_at: null,
      });
      pool.query.mockResolvedValueOnce(makePgResult([uncompletedRow]));

      const result = await todoRepository.toggleComplete(TODO_ID, false);

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      // isCompleted=false branch: SQL literals FALSE and NULL are embedded directly
      expect(sql).toMatch(/is_completed\s*=\s*FALSE/i);
      expect(sql).toMatch(/completed_at\s*=\s*NULL/i);
      // Only todoId is bound as a parameter
      expect(params).toEqual([TODO_ID]);
      expect(result).toEqual(uncompletedRow);
    });
  });
});
