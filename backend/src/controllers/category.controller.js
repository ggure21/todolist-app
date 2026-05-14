'use strict';

const categoryService = require('../services/category.service');
const HTTP_STATUS = require('../constants/http-status');

/**
 * GET /api/categories
 */
async function getCategories(req, res, next) {
  try {
    const categories = await categoryService.getCategories(req.user.userId);
    res.status(HTTP_STATUS.OK).json(categories);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/categories
 */
async function createCategory(req, res, next) {
  try {
    const category = await categoryService.createCategory(req.user.userId, req.body.name);
    res.status(HTTP_STATUS.CREATED).json(category);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/categories/:id
 */
async function deleteCategory(req, res, next) {
  try {
    await categoryService.deleteCategory(req.user.userId, req.params.id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, deleteCategory };
