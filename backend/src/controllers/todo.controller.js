'use strict';

const todoService = require('../services/todo.service');
const HTTP_STATUS = require('../constants/http-status');

async function createTodo(req, res, next) {
  try {
    const todo = await todoService.createTodo(req.user.userId, req.body);
    res.status(HTTP_STATUS.CREATED).json(todo);
  } catch (err) { next(err); }
}

async function getTodos(req, res, next) {
  try {
    const todos = await todoService.getTodos(req.user.userId, req.query);
    res.status(HTTP_STATUS.OK).json(todos);
  } catch (err) { next(err); }
}

async function updateTodo(req, res, next) {
  try {
    const todo = await todoService.updateTodo(req.user.userId, req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json(todo);
  } catch (err) { next(err); }
}

async function deleteTodo(req, res, next) {
  try {
    await todoService.deleteTodo(req.user.userId, req.params.id);
    res.status(HTTP_STATUS.OK).json({ message: '할일이 삭제되었습니다.' });
  } catch (err) { next(err); }
}

async function toggleTodo(req, res, next) {
  try {
    const todo = await todoService.toggleTodo(req.user.userId, req.params.id, req.body.is_completed);
    res.status(HTTP_STATUS.OK).json(todo);
  } catch (err) { next(err); }
}

module.exports = { createTodo, getTodos, updateTodo, deleteTodo, toggleTodo };
