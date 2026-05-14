'use strict';

const userRepository = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password.utils');
const { signToken } = require('../utils/jwt.utils');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');

/**
 * 회원가입 (UC-01)
 * BR-U-01: 이메일 중복 불가
 * BR-U-02: 비밀번호 bcrypt 해싱
 *
 * @param {string} email
 * @param {string} password  평문 비밀번호
 * @param {string} name
 * @returns {Promise<{ message: string }>}
 */
async function registerUser(email, password, name) {
  logger.debug(`registerUser: email=${email}`);
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    logger.warn(`registerUser: email already taken — ${email}`);
    throw new AppError(400, '이미 사용 중인 이메일입니다.', 'EMAIL_DUPLICATE');
  }

  const hashed = await hashPassword(password);
  await userRepository.insertUser(email, hashed, name);

  logger.info(`User registered: email=${email}`);
  return { message: '회원가입이 완료되었습니다.' };
}

/**
 * 로그인 (UC-02)
 * BR-U-02: bcrypt 비밀번호 검증
 * BR-U-03: JWT Access Token 발급
 * 보안: 이메일 미존재/비밀번호 불일치 시 동일한 에러 메시지 반환 (계정 존재 여부 노출 금지)
 *
 * @param {string} email
 * @param {string} password  평문 비밀번호
 * @returns {Promise<{ accessToken: string }>}
 */
async function authenticateUser(email, password) {
  logger.debug(`authenticateUser: email=${email}`);
  const INVALID_ERR = new AppError(401, '이메일 또는 비밀번호가 올바르지 않습니다.', 'INVALID_CREDENTIALS');

  const user = await userRepository.findByEmail(email);
  if (!user) {
    logger.warn(`Login failed: email not found — ${email}`);
    throw INVALID_ERR;
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    logger.warn(`Login failed: wrong password — userId=${user.id}`);
    throw INVALID_ERR;
  }

  const accessToken = signToken(user.id);
  logger.info(`User logged in: userId=${user.id}`);
  return { accessToken };
}

module.exports = { registerUser, authenticateUser };
