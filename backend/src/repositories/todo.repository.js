'use strict';

const pool = require('../config/db');

/**
 * @typedef {Object} TodoRow
 * @property {string}      id           UUID
 * @property {string}      user_id      소유 사용자 UUID
 * @property {string}      category_id  카테고리 UUID
 * @property {string}      title        할일 제목 (최대 500자)
 * @property {string|null} description  상세 설명
 * @property {string|null} due_date     종료예정일 (YYYY-MM-DD)
 * @property {boolean}     is_completed 완료 여부
 * @property {Date|null}   completed_at 완료 처리 일시
 * @property {Date}        created_at   생성 일시
 * @property {Date}        updated_at   수정 일시
 */

/**
 * 사용자 ID 및 선택적 필터 조건으로 할일 목록을 조회합니다.
 *
 * 지원 필터:
 *   - filters.categoryId  {string}  UUID — BR-T-01: 카테고리별 필터
 *   - filters.isCompleted {boolean} — 완료 여부 필터
 *   - filters.overdue     {boolean} — BR-T-06: due_date < CURRENT_DATE (앱 레이어 연동)
 *
 * @param {string} userId              UUID 문자열
 * @param {{ categoryId?: string, isCompleted?: boolean, overdue?: boolean }} [filters={}]
 * @returns {Promise<Array<object>>}   todos 행 배열 (created_at DESC 정렬)
 */
async function findByUserId(userId, filters = {}) {
  const conditions = ['user_id = $1'];
  const values = [userId];
  let idx = 2;

  if (filters.categoryId !== undefined) {
    conditions.push(`category_id = $${idx++}`);
    values.push(filters.categoryId);
  }

  if (filters.isCompleted !== undefined) {
    conditions.push(`is_completed = $${idx++}`);
    values.push(filters.isCompleted);
  }

  // BR-T-06: 기한 초과 필터 — CURRENT_DATE는 상수이므로 파라미터 불필요
  if (filters.overdue === true) {
    conditions.push('due_date < CURRENT_DATE');
  }

  const sql = `
    SELECT *
    FROM todos
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(sql, values);
  return rows;
}

/**
 * UUID로 할일을 단건 조회합니다.
 *
 * @param {string} todoId  UUID 문자열
 * @returns {Promise<object | undefined>}  todos 행 또는 undefined
 */
async function findById(todoId) {
  const sql = 'SELECT * FROM todos WHERE id = $1 LIMIT 1';
  const { rows } = await pool.query(sql, [todoId]);
  return rows[0];
}

/**
 * 새 할일을 삽입하고 생성된 row를 반환합니다.
 *
 * - BR-T-01: category_id 필수
 * - BR-T-02: title 필수 (최대 500자)
 * - BR-T-06: due_date 미래 날짜 검증은 앱 레이어 책임
 *
 * @param {string} userId  UUID 문자열
 * @param {{ category_id: string, title: string, description?: string|null, due_date?: string|null }} input
 * @returns {Promise<object>}  생성된 todos 행
 */
async function insertTodo(userId, input) {
  const sql = `
    INSERT INTO todos (user_id, category_id, title, description, due_date)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [
    userId,
    input.category_id,
    input.title,
    input.description ?? null,
    input.due_date ?? null,
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
}

/**
 * 할일의 편집 가능 필드를 동적으로 업데이트합니다.
 *
 * - BR-T-02: title 500자 제한 검증은 앱 레이어 책임
 * - BR-T-06: due_date 미래 날짜 검증은 앱 레이어 책임
 * - updated_at은 DB 트리거(trg_todos_updated_at)가 자동 갱신
 *
 * @param {string} todoId   UUID 문자열
 * @param {{ title?: string, description?: string|null, due_date?: string|null, category_id?: string }} updates
 * @returns {Promise<object | null>}  업데이트된 todos 행, 업데이트 필드가 없으면 null
 */
async function updateTodo(todoId, updates) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(updates.title);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(updates.description);
  }

  if (updates.due_date !== undefined) {
    fields.push(`due_date = $${idx++}`);
    values.push(updates.due_date);
  }

  if (updates.category_id !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(updates.category_id);
  }

  if (fields.length === 0) return null;

  values.push(todoId);
  const sql = `
    UPDATE todos
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0];
}

/**
 * UUID로 할일을 삭제하고 삭제된 행 수를 반환합니다.
 *
 * @param {string} todoId  UUID 문자열
 * @returns {Promise<number>}  삭제된 행 수 (0 또는 1)
 */
async function deleteById(todoId) {
  const sql = 'DELETE FROM todos WHERE id = $1';
  const result = await pool.query(sql, [todoId]);
  return result.rowCount;
}

/**
 * 할일의 완료 상태를 토글합니다.
 *
 * - BR-T-04: isCompleted=true → is_completed=TRUE, completed_at=NOW()
 * - BR-T-05: isCompleted=false → is_completed=FALSE, completed_at=NULL
 *
 * isCompleted는 제어 흐름 분기에만 사용되며 SQL 파라미터로 전달하지 않습니다.
 * SQL Injection 위험이 없는 불리언 리터럴(TRUE/FALSE)을 직접 삽입합니다.
 *
 * @param {string}  todoId       UUID 문자열
 * @param {boolean} isCompleted  true: 완료 처리, false: 미완료 처리
 * @returns {Promise<object | undefined>}  업데이트된 todos 행
 */
async function toggleComplete(todoId, isCompleted) {
  const sql = isCompleted
    ? `UPDATE todos SET is_completed = TRUE,  completed_at = NOW()  WHERE id = $1 RETURNING *`
    : `UPDATE todos SET is_completed = FALSE, completed_at = NULL   WHERE id = $1 RETURNING *`;

  const { rows } = await pool.query(sql, [todoId]);
  return rows[0];
}

module.exports = {
  findByUserId,
  findById,
  insertTodo,
  updateTodo,
  deleteById,
  toggleComplete,
};
