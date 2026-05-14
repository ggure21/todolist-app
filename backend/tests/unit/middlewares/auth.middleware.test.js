'use strict';

process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

const { signToken } = require('../../../src/utils/jwt.utils');
const authMiddleware = require('../../../src/middlewares/auth.middleware');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
  });

  // -------------------------------------------------------------------------
  // 유효한 토큰
  // -------------------------------------------------------------------------
  describe('valid token', () => {
    it('should call next() and set req.user when a valid Bearer token is provided', () => {
      const userId = 'a1b2c3d4-0000-0000-0000-000000000001';
      const token = signToken(userId);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = makeRes();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toEqual({ userId });
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 토큰 없음
  // -------------------------------------------------------------------------
  describe('missing token', () => {
    it('should return 401 when Authorization header is absent', () => {
      const req = { headers: {} };
      const res = makeRes();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is an empty string', () => {
      const req = { headers: { authorization: '' } };
      const res = makeRes();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when scheme is not Bearer', () => {
      const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
      const res = makeRes();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 위조/만료 토큰
  // -------------------------------------------------------------------------
  describe('invalid token', () => {
    it('should return 401 for a forged token (wrong secret)', () => {
      const jwt = require('jsonwebtoken');
      const forged = jwt.sign({ userId: 'hacker' }, 'wrong-secret', { expiresIn: '1h' });
      const req = { headers: { authorization: `Bearer ${forged}` } };
      const res = makeRes();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for an expired token', () => {
      const jwt = require('jsonwebtoken');
      const expired = jwt.sign(
        { userId: 'user-uuid-001' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' },
      );
      const req = { headers: { authorization: `Bearer ${expired}` } };
      const res = makeRes();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for a completely malformed token string', () => {
      const req = { headers: { authorization: 'Bearer not.a.valid.token' } };
      const res = makeRes();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
