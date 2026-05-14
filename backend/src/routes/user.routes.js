'use strict';

const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateUpdateUser } = require('../middlewares/validate.middleware');

const router = Router();

router.get('/me', authMiddleware, userController.getMe);
router.patch('/me', authMiddleware, validateUpdateUser, userController.updateMe);

module.exports = router;
