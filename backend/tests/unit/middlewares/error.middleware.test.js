'use strict';

jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const logger = require('../../../src/utils/logger');
const AppError = require('../../../src/utils/app-error');
const errorMiddleware = require('../../../src/middlewares/error.middleware');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorMiddleware', () => {
  const req = {};
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // AppError
  // -------------------------------------------------------------------------
  describe('AppError handling', () => {
    it('should respond with statusCode, message, code from AppError', () => {
      const err = new AppError(404, 'Resource not found', 'NOT_FOUND');
      const res = makeRes();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Resource not found', code: 'NOT_FOUND' });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle 400 AppError correctly', () => {
      const err = new AppError(400, 'Validation failed', 'VALIDATION_ERROR');
      const res = makeRes();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed', code: 'VALIDATION_ERROR' });
    });

    it('should handle 401 AppError correctly', () => {
      const err = new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      const res = makeRes();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    });

    it('should handle 409 AppError correctly', () => {
      const err = new AppError(409, 'Email already exists', 'EMAIL_DUPLICATE');
      const res = makeRes();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists', code: 'EMAIL_DUPLICATE' });
    });
  });

  // -------------------------------------------------------------------------
  // 예상치 못한 에러 (500)
  // -------------------------------------------------------------------------
  describe('unexpected error handling', () => {
    it('should respond 500 and log the error for a plain Error', () => {
      const err = new Error('Something went wrong');
      const res = makeRes();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      });
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('should not expose the stack trace to the client', () => {
      const err = new Error('DB connection failed');
      const res = makeRes();

      errorMiddleware(err, req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg).not.toHaveProperty('stack');
      expect(jsonArg.message).toBe('Internal Server Error');
    });

    it('should log error details for unexpected errors', () => {
      const err = new Error('Unexpected crash');
      err.stack = 'Error: Unexpected crash\n  at somewhere.js:10';
      const res = makeRes();

      errorMiddleware(err, req, res, next);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error'),
        err.stack,
      );
    });
  });
});

// -------------------------------------------------------------------------
// AppError class
// -------------------------------------------------------------------------
describe('AppError', () => {
  it('should be an instance of Error', () => {
    const err = new AppError(404, 'Not found', 'NOT_FOUND');
    expect(err).toBeInstanceOf(Error);
  });

  it('should set statusCode, message, code correctly', () => {
    const err = new AppError(422, 'Invalid input', 'INVALID_INPUT');
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe('Invalid input');
    expect(err.code).toBe('INVALID_INPUT');
  });

  it('should have name AppError', () => {
    const err = new AppError(500, 'Internal', 'INTERNAL_ERROR');
    expect(err.name).toBe('AppError');
  });
});
