'use strict';

const userService = require('../services/user.service');
const HTTP_STATUS = require('../constants/http-status');

/**
 * GET /api/users/me
 */
async function getMe(req, res, next) {
  try {
    const user = await userService.getMe(req.user.userId);
    res.status(HTTP_STATUS.OK).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/me
 */
async function updateMe(req, res, next) {
  try {
    const user = await userService.updateMe(req.user.userId, req.body);
    res.status(HTTP_STATUS.OK).json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };
