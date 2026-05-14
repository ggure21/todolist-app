'use strict';

const pool = require('../config/db');

/**
 * @typedef {Object} UserRow
 * @property {string} id          UUID
 * @property {string} email       이메일
 * @property {string} password    bcrypt 해시
 * @property {string} name        표시 이름
 * @property {Date}   created_at  생성 일시
 * @property {Date}   updated_at  수정 일시
 */

/**
 * 이메일로 사용자를 조회합니다.
 *
 * @param {string} email
 * @returns {Promise<{id: string, email: string, password: string, name: string, created_at: Date, updated_at: Date} | undefined>}
 */
async function findByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
  const { rows } = await pool.query(sql, [email]);
  return rows[0];
}

/**
 * 새 사용자를 삽입하고 생성된 row를 반환합니다.
 *
 * @param {string} email
 * @param {string} password  bcrypt 해시
 * @param {string} name
 * @returns {Promise<{id: string, email: string, password: string, name: string, created_at: Date, updated_at: Date}>}
 */
async function insertUser(email, password, name) {
  const sql = `
    INSERT INTO users (email, password, name)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [email, password, name]);
  return rows[0];
}

/**
 * UUID로 사용자를 조회합니다.
 *
 * @param {string} userId  UUID 문자열
 * @returns {Promise<{id: string, email: string, password: string, name: string, created_at: Date, updated_at: Date} | undefined>}
 */
async function findById(userId) {
  const sql = 'SELECT * FROM users WHERE id = $1 LIMIT 1';
  const { rows } = await pool.query(sql, [userId]);
  return rows[0];
}

/**
 * 사용자 정보를 업데이트합니다.
 * 업데이트할 필드가 없으면 null을 반환합니다.
 *
 * @param {string} userId  UUID 문자열
 * @param {{ name?: string, password?: string }} updates  변경할 필드
 * @returns {Promise<{id: string, email: string, password: string, name: string, created_at: Date, updated_at: Date} | null>}
 */
async function updateUser(userId, updates) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.password !== undefined) {
    fields.push(`password = $${idx++}`);
    values.push(updates.password);
  }

  if (fields.length === 0) return null;

  values.push(userId);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

  const { rows } = await pool.query(sql, values);
  return rows[0];
}

module.exports = { findByEmail, insertUser, findById, updateUser };
