'use strict';

process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

const jwt = require('jsonwebtoken');
const { signToken, verifyToken, extractToken } = require('../../../src/utils/jwt.utils');

describe('jwt.utils', () => {
  // -------------------------------------------------------------------------
  // signToken
  // -------------------------------------------------------------------------
  describe('signToken(userId)', () => {
    it('should return a non-empty JWT string', () => {
      const token = signToken('user-uuid-001');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should embed userId in the payload', () => {
      const userId = 'a1b2c3d4-0000-0000-0000-000000000001';
      const token = signToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(userId);
    });

    it('should include an expiry claim (exp)', () => {
      const token = signToken('user-uuid-001');
      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  // -------------------------------------------------------------------------
  // verifyToken
  // -------------------------------------------------------------------------
  describe('verifyToken(token)', () => {
    it('should return { userId } for a valid token', () => {
      const userId = 'a1b2c3d4-0000-0000-0000-000000000001';
      const token = signToken(userId);
      const result = verifyToken(token);
      expect(result).toEqual({ userId });
    });

    it('should return null for a forged token (wrong secret)', () => {
      const forged = jwt.sign({ userId: 'hacker' }, 'wrong-secret', { expiresIn: '1h' });
      expect(verifyToken(forged)).toBeNull();
    });

    it('should return null for an expired token', () => {
      const expired = jwt.sign(
        { userId: 'user-uuid-001' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' },
      );
      expect(verifyToken(expired)).toBeNull();
    });

    it('should return null for a completely invalid string', () => {
      expect(verifyToken('not.a.token')).toBeNull();
    });

    it('should return null for an empty string', () => {
      expect(verifyToken('')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // extractToken
  // -------------------------------------------------------------------------
  describe('extractToken(authHeader)', () => {
    it('should extract the token from a valid Bearer header', () => {
      const token = signToken('user-uuid-001');
      expect(extractToken(`Bearer ${token}`)).toBe(token);
    });

    it('should return null when the header is undefined', () => {
      expect(extractToken(undefined)).toBeNull();
    });

    it('should return null when the header is an empty string', () => {
      expect(extractToken('')).toBeNull();
    });

    it('should return null when the scheme is not Bearer', () => {
      expect(extractToken('Basic dXNlcjpwYXNz')).toBeNull();
    });

    it('should return null when Bearer is followed by only whitespace', () => {
      expect(extractToken('Bearer   ')).toBeNull();
    });

    it('should handle the Bearer prefix case-sensitively (no "bearer ")', () => {
      const token = signToken('user-uuid-001');
      expect(extractToken(`bearer ${token}`)).toBeNull();
    });
  });
});
