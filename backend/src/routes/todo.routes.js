'use strict';

const { Router } = require('express');
const todoController = require('../controllers/todo.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  validateCreateTodo,
  validateUpdateTodo,
  validateToggleComplete,
} = require('../middlewares/validate.middleware');

const router = Router();

router.get('/', authMiddleware, todoController.getTodos);
router.post('/', authMiddleware, validateCreateTodo, todoController.createTodo);
router.patch('/:id', authMiddleware, validateUpdateTodo, todoController.updateTodo);
router.delete('/:id', authMiddleware, todoController.deleteTodo);
router.patch('/:id/complete', authMiddleware, validateToggleComplete, todoController.toggleTodo);

module.exports = router;
