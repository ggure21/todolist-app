'use strict';

const logger = require('../utils/logger');
const AppError = require('../utils/app-error');

/**
 * 글로벌 에러 핸들링 미들웨어.
 * AppError → statusCode/message/code 그대로 응답.
 * 그 외 예상치 못한 에러 → 500, 스택 트레이스는 로그에만 기록.
 * 응답 형식: { "message": "...", "code": "..." }
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  if (err instanceof AppError) {
    const level = err.statusCode >= 500 ? 'error' : 'warn';
    logger[level](`AppError [${err.code}] ${req.method} ${req.originalUrl} → ${err.statusCode}: ${err.message}`);
    return res.status(err.statusCode).json({ message: err.message, code: err.code });
  }

  logger.error(`Unexpected error on ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  return res.status(500).json({ message: 'Internal Server Error', code: 'INTERNAL_ERROR' });
}

module.exports = errorMiddleware;
