'use strict';

const categoryRepository = require('../repositories/category.repository');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');

/**
 * 기본 카테고리 + 사용자 정의 카테고리를 통합 조회한다. (BR-C-01, BR-C-02)
 *
 * @param {string} userId  UUID
 * @returns {Promise<CategoryRow[]>}
 */
async function getCategories(userId) {
  logger.debug(`getCategories: userId=${userId}`);
  return categoryRepository.findByUserIdAndDefault(userId);
}

/**
 * 사용자 정의 카테고리를 생성한다. (UC-04 / BR-C-04)
 * 동일 사용자 내 이름 중복 불가
 *
 * @param {string} userId
 * @param {string} name
 * @returns {Promise<CategoryRow>}
 */
async function createCategory(userId, name) {
  logger.debug(`createCategory: userId=${userId} name=${name}`);
  const existing = await categoryRepository.findByUserIdAndName(userId, name);
  if (existing) {
    logger.warn(`createCategory: duplicate name — userId=${userId} name=${name}`);
    throw new AppError(400, '이미 사용 중인 카테고리 이름입니다.', 'CATEGORY_NAME_DUPLICATE');
  }
  const category = await categoryRepository.insertCategory(userId, name);
  logger.info(`Category created: categoryId=${category.id} userId=${userId} name=${name}`);
  return category;
}

/**
 * 사용자 정의 카테고리를 삭제한다. (BR-C-01, BR-C-03)
 * 기본 카테고리 삭제 불가, 해당 카테고리에 할일이 있으면 삭제 불가
 *
 * @param {string} userId
 * @param {string} categoryId
 * @returns {Promise<void>}
 */
async function deleteCategory(userId, categoryId) {
  logger.debug(`deleteCategory: userId=${userId} categoryId=${categoryId}`);
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    logger.warn(`deleteCategory: category not found — categoryId=${categoryId}`);
    throw new AppError(404, '카테고리를 찾을 수 없습니다.', 'CATEGORY_NOT_FOUND');
  }
  if (category.is_default) {
    logger.warn(`deleteCategory: default category delete attempt — categoryId=${categoryId} userId=${userId}`);
    throw new AppError(400, '기본 카테고리는 삭제할 수 없습니다.', 'DEFAULT_CATEGORY_DELETE_NOT_ALLOWED');
  }
  if (category.user_id !== userId) {
    logger.warn(`deleteCategory: forbidden — categoryId=${categoryId} ownerId=${category.user_id} requesterId=${userId}`);
    throw new AppError(403, '본인의 카테고리만 삭제할 수 있습니다.', 'FORBIDDEN');
  }

  const todoCount = await categoryRepository.countTodosByCategory(categoryId);
  if (todoCount > 0) {
    logger.warn(`deleteCategory: category has ${todoCount} todos — categoryId=${categoryId}`);
    throw new AppError(400, '할일이 있는 카테고리는 삭제할 수 없습니다.', 'CATEGORY_HAS_TODOS');
  }

  await categoryRepository.deleteById(categoryId);
  logger.info(`Category deleted: categoryId=${categoryId} userId=${userId}`);
}

module.exports = { getCategories, createCategory, deleteCategory };
