'use strict';

const { extractToken, verifyToken } = require('../utils/jwt.utils');
const logger = require('../utils/logger');

/**
 * JWT 인증 미들웨어 (BR-U-03)
 * Authorization: Bearer <token> 헤더를 검증하고
 * 성공 시 req.user = { userId }를 설정한다.
 * 실패 시 401 Unauthorized를 반환한다.
 */
function authMiddleware(req, res, next) {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    logger.warn(`Auth failed: no token — ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const payload = verifyToken(token);

  if (!payload) {
    logger.warn(`Auth failed: invalid token — ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  logger.debug(`Auth OK: userId=${payload.userId} — ${req.method} ${req.originalUrl}`);
  req.user = { userId: payload.userId };
  return next();
}

module.exports = authMiddleware;
