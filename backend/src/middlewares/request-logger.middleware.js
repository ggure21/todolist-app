'use strict';

const logger = require('../utils/logger');

/**
 * HTTP 요청/응답 로깅 미들웨어.
 * 모든 요청에 대해 메서드, 경로, 상태코드, 소요시간을 기록한다.
 */
function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
        : 'info';

    const userId = req.user?.userId ?? '-';
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms userId=${userId}`);
  });

  next();
}

module.exports = requestLoggerMiddleware;
