'use strict';

// Mock the pg pool before requiring any modules that depend on it.
// db.js exports a Pool instance directly, so we mock the module to return
// a plain object whose `query` property is a jest.fn().
jest.mock('../../../src/config/db', () => ({
  query: jest.fn(),
}));

const pool = require('../../../src/config/db');
const userRepository = require('../../../src/repositories/user.repository');

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
 * A realistic user row as it would come back from PostgreSQL.
 */
function makeUserRow(overrides = {}) {
  return {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    email: 'alice@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Alice',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('userRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findByEmail
  // -------------------------------------------------------------------------
  describe('findByEmail(email)', () => {
    it('should return the user row when the email exists', async () => {
      const userRow = makeUserRow();
      pool.query.mockResolvedValueOnce(makePgResult([userRow]));

      const result = await userRepository.findByEmail('alice@example.com');

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['alice@example.com'],
      );
      expect(result).toEqual(userRow);
    });

    it('should return undefined when the email does not exist', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([]));

      const result = await userRepository.findByEmail('nobody@example.com');

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // insertUser
  // -------------------------------------------------------------------------
  describe('insertUser(email, password, name)', () => {
    it('should return the newly created user row on successful insertion', async () => {
      const newUser = makeUserRow({ name: 'Bob', email: 'bob@example.com' });
      pool.query.mockResolvedValueOnce(makePgResult([newUser]));

      const result = await userRepository.insertUser(
        'bob@example.com',
        '$2b$10$hashedpw',
        'Bob',
      );

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        ['bob@example.com', '$2b$10$hashedpw', 'Bob'],
      );
      expect(result).toEqual(newUser);
    });

    it('should throw an error when the email already exists (unique violation code 23505)', async () => {
      const duplicateError = new Error(
        'duplicate key value violates unique constraint "uq_users_email"',
      );
      duplicateError.code = '23505';
      pool.query.mockRejectedValueOnce(duplicateError);

      await expect(
        userRepository.insertUser('alice@example.com', '$2b$10$hashedpw', 'Alice2'),
      ).rejects.toMatchObject({ code: '23505' });

      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  describe('findById(userId)', () => {
    it('should return the user row when the ID exists', async () => {
      const userRow = makeUserRow();
      pool.query.mockResolvedValueOnce(makePgResult([userRow]));

      const result = await userRepository.findById(userRow.id);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userRow.id],
      );
      expect(result).toEqual(userRow);
    });

    it('should return undefined when the ID does not exist', async () => {
      pool.query.mockResolvedValueOnce(makePgResult([]));

      const result = await userRepository.findById('00000000-0000-0000-0000-000000000000');

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // updateUser
  // -------------------------------------------------------------------------
  describe('updateUser(userId, updates)', () => {
    const userId = 'a1b2c3d4-0000-0000-0000-000000000001';

    it('should return the updated row when only name is provided', async () => {
      const updatedRow = makeUserRow({ name: 'Alice Updated' });
      pool.query.mockResolvedValueOnce(makePgResult([updatedRow]));

      const result = await userRepository.updateUser(userId, { name: 'Alice Updated' });

      expect(pool.query).toHaveBeenCalledTimes(1);
      // The query must include the userId as a bound parameter.
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['Alice Updated', userId]),
      );
      expect(result).toEqual(updatedRow);
    });

    it('should return the updated row when only password is provided', async () => {
      const updatedRow = makeUserRow({ password: '$2b$10$newhashedpw' });
      pool.query.mockResolvedValueOnce(makePgResult([updatedRow]));

      const result = await userRepository.updateUser(userId, {
        password: '$2b$10$newhashedpw',
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['$2b$10$newhashedpw', userId]),
      );
      expect(result).toEqual(updatedRow);
    });

    it('should return the updated row when both name and password are provided', async () => {
      const updatedRow = makeUserRow({
        name: 'Alice New',
        password: '$2b$10$newhashedpw',
      });
      pool.query.mockResolvedValueOnce(makePgResult([updatedRow]));

      const result = await userRepository.updateUser(userId, {
        name: 'Alice New',
        password: '$2b$10$newhashedpw',
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['Alice New', '$2b$10$newhashedpw', userId]),
      );
      expect(result).toEqual(updatedRow);
    });

    it('should return null without calling pool.query when updates is an empty object', async () => {
      const result = await userRepository.updateUser(userId, {});

      expect(pool.query).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
