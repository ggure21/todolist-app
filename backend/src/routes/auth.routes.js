'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middlewares/validate.middleware');

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

module.exports = router;
