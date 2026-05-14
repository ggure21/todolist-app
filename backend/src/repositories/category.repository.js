'use strict';

const pool = require('../config/db');

/**
 * @typedef {Object} CategoryRow
 * @property {string}      id          UUID
 * @property {string|null} user_id     소유 사용자 UUID (null이면 기본 카테고리)
 * @property {string}      name        카테고리 이름
 * @property {boolean}     is_default  기본 카테고리 여부
 * @property {Date}        created_at  생성 일시
 */

/**
 * 기본 카테고리(is_default=true, user_id IS NULL)와 해당 사용자의 카테고리를 통합 조회합니다.
 *
 * @param {string} userId  UUID 문자열
 * @returns {Promise<Array<{id: string, user_id: string|null, name: string, is_default: boolean, created_at: Date}>>}
 */
async function findByUserIdAndDefault(userId) {
  const sql = `
    SELECT *
    FROM categories
    WHERE user_id = $1
       OR (user_id IS NULL AND is_default = TRUE)
    ORDER BY is_default DESC, created_at ASC
  `;
  const { rows } = await pool.query(sql, [userId]);
  return rows;
}

/**
 * UUID로 카테고리를 단건 조회합니다.
 *
 * @param {string} categoryId  UUID 문자열
 * @returns {Promise<{id: string, user_id: string|null, name: string, is_default: boolean, created_at: Date} | undefined>}
 */
async function findById(categoryId) {
  const sql = 'SELECT * FROM categories WHERE id = $1 LIMIT 1';
  const { rows } = await pool.query(sql, [categoryId]);
  return rows[0];
}

/**
 * 사용자 ID와 카테고리 이름으로 카테고리를 단건 조회합니다. (BR-C-04 이름 중복 확인)
 *
 * @param {string} userId  UUID 문자열
 * @param {string} name    카테고리 이름
 * @returns {Promise<{id: string, user_id: string, name: string, is_default: boolean, created_at: Date} | undefined>}
 */
async function findByUserIdAndName(userId, name) {
  const sql = `
    SELECT *
    FROM categories
    WHERE user_id = $1
      AND name = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [userId, name]);
  return rows[0];
}

/**
 * 새 카테고리를 삽입하고 생성된 row를 반환합니다.
 *
 * @param {string} userId  UUID 문자열
 * @param {string} name    카테고리 이름
 * @returns {Promise<{id: string, user_id: string, name: string, is_default: boolean, created_at: Date}>}
 */
async function insertCategory(userId, name) {
  const sql = `
    INSERT INTO categories (user_id, name)
    VALUES ($1, $2)
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [userId, name]);
  return rows[0];
}

/**
 * UUID로 카테고리를 삭제하고 삭제된 행 수를 반환합니다.
 *
 * @param {string} categoryId  UUID 문자열
 * @returns {Promise<number>}  삭제된 행 수 (0 또는 1)
 */
async function deleteById(categoryId) {
  const sql = 'DELETE FROM categories WHERE id = $1';
  const result = await pool.query(sql, [categoryId]);
  return result.rowCount;
}

/**
 * 특정 카테고리에 속한 할일 수를 반환합니다. (BR-C-03 삭제 전 할일 존재 여부 확인)
 *
 * @param {string} categoryId  UUID 문자열
 * @returns {Promise<number>}  해당 카테고리에 속한 todos 개수
 */
async function countTodosByCategory(categoryId) {
  const sql = 'SELECT COUNT(*) FROM todos WHERE category_id = $1';
  const { rows } = await pool.query(sql, [categoryId]);
  return Number(rows[0].count);
}

module.exports = {
  findByUserIdAndDefault,
  findById,
  findByUserIdAndName,
  insertCategory,
  deleteById,
  countTodosByCategory,
};
