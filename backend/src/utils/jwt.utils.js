'use strict';

const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * userId로 JWT Access Token을 생성한다.
 *
 * @param {string} userId  UUID 문자열
 * @returns {string}  서명된 JWT
 */
function signToken(userId) {
  return jwt.sign({ userId }, SECRET(), { expiresIn: EXPIRES_IN });
}

/**
 * JWT를 검증하고 페이로드를 반환한다.
 * 검증 실패(만료, 위조 등) 시 null을 반환한다.
 *
 * @param {string} token
 * @returns {{ userId: string } | null}
 */
function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET());
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * Authorization 헤더에서 Bearer 토큰을 추출한다.
 * 형식이 올바르지 않으면 null을 반환한다.
 *
 * @param {string | undefined} authHeader  Authorization 헤더 값
 * @returns {string | null}
 */
function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

module.exports = { signToken, verifyToken, extractToken };
