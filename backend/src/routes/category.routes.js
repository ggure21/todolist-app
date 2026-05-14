'use strict';

const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateCreateCategory } = require('../middlewares/validate.middleware');

const router = Router();

router.get('/', authMiddleware, categoryController.getCategories);
router.post('/', authMiddleware, validateCreateCategory, categoryController.createCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
