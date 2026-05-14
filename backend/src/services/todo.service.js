'use strict';

const todoRepository = require('../repositories/todo.repository');
const categoryRepository = require('../repositories/category.repository');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');

/**
 * 카테고리 접근 권한을 검증한다. (BR-C-02)
 * 기본 카테고리(is_default=true)는 전체 공유, 사용자 정의는 소유자만 접근 가능
 *
 * @param {string} userId
 * @param {string} categoryId
 * @throws {AppError} 카테고리 없음(404) 또는 접근 권한 없음(403)
 */
async function assertCategoryAccess(userId, categoryId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    logger.warn(`assertCategoryAccess: category not found — categoryId=${categoryId}`);
    throw new AppError(404, '카테고리를 찾을 수 없습니다.', 'CATEGORY_NOT_FOUND');
  }
  if (!category.is_default && category.user_id !== userId) {
    logger.warn(`assertCategoryAccess: forbidden — categoryId=${categoryId} ownerId=${category.user_id} requesterId=${userId}`);
    throw new AppError(403, '해당 카테고리에 접근할 권한이 없습니다.', 'CATEGORY_ACCESS_FORBIDDEN');
  }
}

/**
 * 할일을 생성한다. (UC-05 / BR-T-01, BR-T-02)
 *
 * @param {string} userId
 * @param {{ title, category_id, description?, due_date? }} input
 * @returns {Promise<TodoRow>}
 */
async function createTodo(userId, input) {
  logger.debug(`createTodo: userId=${userId} categoryId=${input.category_id}`);
  await assertCategoryAccess(userId, input.category_id);
  const todo = await todoRepository.insertTodo(userId, input);
  logger.info(`Todo created: todoId=${todo.id} userId=${userId}`);
  return todo;
}

/**
 * 할일 목록을 조회한다. (UC-06 / BR-F-01~F-04)
 *
 * @param {string} userId
 * @param {{ category_id?, is_completed?, overdue? }} query
 * @returns {Promise<TodoRow[]>}
 */
async function getTodos(userId, query = {}) {
  const filters = {};
  if (query.category_id !== undefined) filters.categoryId = query.category_id;
  if (query.is_completed !== undefined) filters.isCompleted = query.is_completed === 'true' || query.is_completed === true;
  if (query.overdue === 'true' || query.overdue === true) filters.overdue = true;
  logger.debug(`getTodos: userId=${userId} filters=${JSON.stringify(filters)}`);
  return todoRepository.findByUserId(userId, filters);
}

/**
 * 할일을 수정한다. (UC-07)
 * 소유자만 수정 가능 (BR-T-03)
 *
 * @param {string} userId
 * @param {string} todoId
 * @param {{ title?, description?, due_date?, category_id? }} updates
 * @returns {Promise<TodoRow>}
 */
async function updateTodo(userId, todoId, updates) {
  logger.debug(`updateTodo: userId=${userId} todoId=${todoId}`);
  const todo = await todoRepository.findById(todoId);
  if (!todo) {
    logger.warn(`updateTodo: todo not found — todoId=${todoId}`);
    throw new AppError(404, '할일을 찾을 수 없습니다.', 'TODO_NOT_FOUND');
  }
  if (todo.user_id !== userId) {
    logger.warn(`updateTodo: forbidden — todoId=${todoId} ownerId=${todo.user_id} requesterId=${userId}`);
    throw new AppError(403, '본인의 할일만 수정할 수 있습니다.', 'FORBIDDEN');
  }

  if (updates.category_id !== undefined) {
    await assertCategoryAccess(userId, updates.category_id);
  }

  const updated = await todoRepository.updateTodo(todoId, updates);
  logger.info(`Todo updated: todoId=${todoId} userId=${userId}`);
  return updated || todo;
}

/**
 * 할일을 삭제한다. (UC-09)
 * 소유자만 삭제 가능 (BR-T-03)
 *
 * @param {string} userId
 * @param {string} todoId
 * @returns {Promise<void>}
 */
async function deleteTodo(userId, todoId) {
  logger.debug(`deleteTodo: userId=${userId} todoId=${todoId}`);
  const todo = await todoRepository.findById(todoId);
  if (!todo) {
    logger.warn(`deleteTodo: todo not found — todoId=${todoId}`);
    throw new AppError(404, '할일을 찾을 수 없습니다.', 'TODO_NOT_FOUND');
  }
  if (todo.user_id !== userId) {
    logger.warn(`deleteTodo: forbidden — todoId=${todoId} ownerId=${todo.user_id} requesterId=${userId}`);
    throw new AppError(403, '본인의 할일만 삭제할 수 있습니다.', 'FORBIDDEN');
  }
  await todoRepository.deleteById(todoId);
  logger.info(`Todo deleted: todoId=${todoId} userId=${userId}`);
}

/**
 * 할일 완료/미완료 처리. (UC-08 / BR-T-04, BR-T-05)
 *
 * @param {string} userId
 * @param {string} todoId
 * @param {boolean} isCompleted
 * @returns {Promise<TodoRow>}
 */
async function toggleTodo(userId, todoId, isCompleted) {
  logger.debug(`toggleTodo: userId=${userId} todoId=${todoId} isCompleted=${isCompleted}`);
  const todo = await todoRepository.findById(todoId);
  if (!todo) {
    logger.warn(`toggleTodo: todo not found — todoId=${todoId}`);
    throw new AppError(404, '할일을 찾을 수 없습니다.', 'TODO_NOT_FOUND');
  }
  if (todo.user_id !== userId) {
    logger.warn(`toggleTodo: forbidden — todoId=${todoId} ownerId=${todo.user_id} requesterId=${userId}`);
    throw new AppError(403, '본인의 할일만 수정할 수 있습니다.', 'FORBIDDEN');
  }
  const result = await todoRepository.toggleComplete(todoId, isCompleted);
  logger.info(`Todo toggled: todoId=${todoId} userId=${userId} isCompleted=${isCompleted}`);
  return result;
}

module.exports = { createTodo, getTodos, updateTodo, deleteTodo, toggleTodo };
