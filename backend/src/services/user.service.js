'use strict';

const userRepository = require('../repositories/user.repository');
const { comparePassword, hashPassword } = require('../utils/password.utils');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');

/**
 * 사용자 ID로 본인 정보를 조회한다. (UC-03)
 * password 필드를 제외하고 반환한다.
 *
 * @param {string} userId  UUID
 * @returns {Promise<{ id, email, name, created_at, updated_at }>}
 */
async function getMe(userId) {
  logger.debug(`getMe: userId=${userId}`);
  const user = await userRepository.findById(userId);
  if (!user) {
    logger.warn(`getMe: user not found — userId=${userId}`);
    throw new AppError(404, '사용자를 찾을 수 없습니다.', 'USER_NOT_FOUND');
  }

  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

/**
 * 본인 정보를 수정한다. (UC-03 / BR-U-04)
 * BR-U-04: 이름·비밀번호만 수정 가능, 이메일 변경 불가
 *
 * @param {string} userId
 * @param {{ name?: string, email?: string, current_password?: string, new_password?: string }} body
 * @returns {Promise<{ id, email, name, created_at, updated_at }>}
 */
async function updateMe(userId, body) {
  logger.debug(`updateMe: userId=${userId} fields=${Object.keys(body).join(',')}`);

  if (body.email !== undefined) {
    logger.warn(`updateMe: email change attempt — userId=${userId}`);
    throw new AppError(400, '이메일은 변경할 수 없습니다.', 'EMAIL_CHANGE_NOT_ALLOWED');
  }

  const updates = {};

  if (body.name !== undefined) {
    updates.name = body.name;
  }

  if (body.new_password !== undefined) {
    const user = await userRepository.findById(userId);
    const match = await comparePassword(body.current_password, user.password);
    if (!match) {
      logger.warn(`updateMe: wrong current password — userId=${userId}`);
      throw new AppError(400, '현재 비밀번호가 올바르지 않습니다.', 'WRONG_CURRENT_PASSWORD');
    }
    updates.password = await hashPassword(body.new_password);
  }

  const updated = await userRepository.updateUser(userId, updates);
  const row = updated || await userRepository.findById(userId);

  logger.info(`User updated: userId=${userId} fields=${Object.keys(updates).join(',') || 'none'}`);
  const { password: _pw, ...safeUser } = row;
  return safeUser;
}

module.exports = { getMe, updateMe };
