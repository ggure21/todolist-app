'use strict';

const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const categoryRoutes = require('./category.routes');
const todoRoutes = require('./todo.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/todos', todoRoutes);

module.exports = router;
