'use strict';

const authService = require('../services/auth.service');
const HTTP_STATUS = require('../constants/http-status');

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.registerUser(email, password, name);
    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.authenticateUser(email, password);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
