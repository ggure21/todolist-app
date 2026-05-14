'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(res, message) {
  return res.status(400).json({ message, code: 'VALIDATION_ERROR' });
}

/** 오늘 날짜(YYYY-MM-DD) 기준으로 과거인지 확인 */
function isPastDate(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

/** YYYY-MM-DD 형식이고 유효한 날짜인지 확인 */
function isValidDate(dateString) {
  if (!DATE_RE.test(dateString)) return false;
  const d = new Date(dateString);
  return !isNaN(d.getTime());
}

// ---------------------------------------------------------------------------

/**
 * POST /api/auth/signup 요청 본문 검증
 * email 형식, password 8자↑, name 필수
 */
function validateRegister(req, res, next) {
  const { email, password, name } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return badRequest(res, '유효한 이메일 주소를 입력해주세요.');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return badRequest(res, '비밀번호는 8자 이상이어야 합니다.');
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return badRequest(res, '이름을 입력해주세요.');
  }

  return next();
}

/**
 * POST /api/auth/login 요청 본문 검증
 * email, password 필수
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return badRequest(res, '이메일을 입력해주세요.');
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    return badRequest(res, '비밀번호를 입력해주세요.');
  }

  return next();
}

/**
 * POST /api/todos 요청 본문 검증
 * title, category_id 필수; due_date 형식 및 오늘 이후 (BR-T-06)
 */
function validateCreateTodo(req, res, next) {
  const { title, category_id, due_date } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return badRequest(res, '할일 제목을 입력해주세요.');
  }
  if (title.length > 500) {
    return badRequest(res, '할일 제목은 500자 이하여야 합니다.');
  }
  if (!category_id || !UUID_RE.test(category_id)) {
    return badRequest(res, '유효한 카테고리 ID를 입력해주세요.');
  }
  if (due_date !== undefined && due_date !== null) {
    if (!isValidDate(due_date)) {
      return badRequest(res, '종료예정일은 YYYY-MM-DD 형식이어야 합니다.');
    }
    if (isPastDate(due_date)) {
      return badRequest(res, '종료예정일은 오늘 이후 날짜여야 합니다.');
    }
  }

  return next();
}

/**
 * PATCH /api/todos/:id 요청 본문 검증
 * 선택 필드 형식 검증; due_date 입력 시 오늘 이후 (BR-T-06)
 */
function validateUpdateTodo(req, res, next) {
  const { title, category_id, due_date } = req.body || {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return badRequest(res, '할일 제목을 입력해주세요.');
    }
    if (title.length > 500) {
      return badRequest(res, '할일 제목은 500자 이하여야 합니다.');
    }
  }
  if (category_id !== undefined && !UUID_RE.test(category_id)) {
    return badRequest(res, '유효한 카테고리 ID를 입력해주세요.');
  }
  if (due_date !== undefined && due_date !== null) {
    if (!isValidDate(due_date)) {
      return badRequest(res, '종료예정일은 YYYY-MM-DD 형식이어야 합니다.');
    }
    if (isPastDate(due_date)) {
      return badRequest(res, '종료예정일은 오늘 이후 날짜여야 합니다.');
    }
  }

  return next();
}

/**
 * PATCH /api/todos/:id/toggle 요청 본문 검증
 * is_completed boolean 필수
 */
function validateToggleComplete(req, res, next) {
  const { is_completed } = req.body || {};

  if (typeof is_completed !== 'boolean') {
    return badRequest(res, 'is_completed는 boolean 값이어야 합니다.');
  }

  return next();
}

/**
 * POST /api/categories 요청 본문 검증
 * name 필수
 */
function validateCreateCategory(req, res, next) {
  const { name } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return badRequest(res, '카테고리 이름을 입력해주세요.');
  }

  return next();
}

/**
 * PATCH /api/users/me 요청 본문 검증
 * name/password 선택; new_password 입력 시 current_password 필수, 8자↑
 */
function validateUpdateUser(req, res, next) {
  const { name, current_password, new_password } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return badRequest(res, '이름을 입력해주세요.');
    }
  }
  if (new_password !== undefined) {
    if (!current_password || typeof current_password !== 'string' || current_password.length === 0) {
      return badRequest(res, '비밀번호 변경 시 현재 비밀번호를 입력해주세요.');
    }
    if (typeof new_password !== 'string' || new_password.length < 8) {
      return badRequest(res, '새 비밀번호는 8자 이상이어야 합니다.');
    }
  }

  return next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateTodo,
  validateUpdateTodo,
  validateToggleComplete,
  validateCreateCategory,
  validateUpdateUser,
};
