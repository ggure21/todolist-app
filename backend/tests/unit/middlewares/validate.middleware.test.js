'use strict';

const {
  validateRegister,
  validateLogin,
  validateCreateTodo,
  validateUpdateTodo,
  validateToggleComplete,
  validateCreateCategory,
  validateUpdateUser,
} = require('../../../src/middlewares/validate.middleware');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq(body) {
  return { body };
}

/** 날짜를 오늘 기준 +N일로 반환 (YYYY-MM-DD) */
function futureDate(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 날짜를 오늘 기준 -N일로 반환 (YYYY-MM-DD) */
function pastDate(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const VALID_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

// ---------------------------------------------------------------------------
// validateRegister
// ---------------------------------------------------------------------------
describe('validateRegister', () => {
  let next;
  beforeEach(() => { next = jest.fn(); });

  it('passes with valid email, password(≥8), name', () => {
    const res = makeRes();
    validateRegister(makeReq({ email: 'a@b.com', password: '12345678', name: 'Alice' }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects missing email', () => {
    const res = makeRes();
    validateRegister(makeReq({ password: '12345678', name: 'Alice' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid email format', () => {
    const res = makeRes();
    validateRegister(makeReq({ email: 'not-an-email', password: '12345678', name: 'Alice' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects password shorter than 8 characters', () => {
    const res = makeRes();
    validateRegister(makeReq({ email: 'a@b.com', password: '1234567', name: 'Alice' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects missing name', () => {
    const res = makeRes();
    validateRegister(makeReq({ email: 'a@b.com', password: '12345678' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects blank name (whitespace only)', () => {
    const res = makeRes();
    validateRegister(makeReq({ email: 'a@b.com', password: '12345678', name: '   ' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// validateLogin
// ---------------------------------------------------------------------------
describe('validateLogin', () => {
  let next;
  beforeEach(() => { next = jest.fn(); });

  it('passes with email and password', () => {
    const res = makeRes();
    validateLogin(makeReq({ email: 'a@b.com', password: 'anypassword' }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects missing email', () => {
    const res = makeRes();
    validateLogin(makeReq({ password: 'pw' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects empty email string', () => {
    const res = makeRes();
    validateLogin(makeReq({ email: '', password: 'pw' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects missing password', () => {
    const res = makeRes();
    validateLogin(makeReq({ email: 'a@b.com' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// validateCreateTodo
// ---------------------------------------------------------------------------
describe('validateCreateTodo', () => {
  let next;
  beforeEach(() => { next = jest.fn(); });

  it('passes with title, category_id only (no due_date)', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ title: 'Task', category_id: VALID_UUID }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes with valid future due_date', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ title: 'Task', category_id: VALID_UUID, due_date: futureDate(3) }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects missing title', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ category_id: VALID_UUID }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects title longer than 500 characters', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ title: 'a'.repeat(501), category_id: VALID_UUID }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects missing category_id', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ title: 'Task' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid category_id UUID', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ title: 'Task', category_id: 'not-a-uuid' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects past due_date', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ title: 'Task', category_id: VALID_UUID, due_date: pastDate(1) }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid date format for due_date', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ title: 'Task', category_id: VALID_UUID, due_date: '20260101' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes when due_date is null (remove due_date)', () => {
    const res = makeRes();
    validateCreateTodo(makeReq({ title: 'Task', category_id: VALID_UUID, due_date: null }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// validateUpdateTodo
// ---------------------------------------------------------------------------
describe('validateUpdateTodo', () => {
  let next;
  beforeEach(() => { next = jest.fn(); });

  it('passes with empty body (no-op patch)', () => {
    const res = makeRes();
    validateUpdateTodo(makeReq({}), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes with valid partial fields', () => {
    const res = makeRes();
    validateUpdateTodo(makeReq({ title: 'New title', due_date: futureDate(5) }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects title over 500 chars', () => {
    const res = makeRes();
    validateUpdateTodo(makeReq({ title: 'x'.repeat(501) }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid category_id UUID', () => {
    const res = makeRes();
    validateUpdateTodo(makeReq({ category_id: 'bad-uuid' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects past due_date', () => {
    const res = makeRes();
    validateUpdateTodo(makeReq({ due_date: pastDate(2) }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes when due_date is null (remove due_date)', () => {
    const res = makeRes();
    validateUpdateTodo(makeReq({ due_date: null }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// validateToggleComplete
// ---------------------------------------------------------------------------
describe('validateToggleComplete', () => {
  let next;
  beforeEach(() => { next = jest.fn(); });

  it('passes with is_completed = true', () => {
    const res = makeRes();
    validateToggleComplete(makeReq({ is_completed: true }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes with is_completed = false', () => {
    const res = makeRes();
    validateToggleComplete(makeReq({ is_completed: false }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects missing is_completed', () => {
    const res = makeRes();
    validateToggleComplete(makeReq({}), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects string "true" instead of boolean', () => {
    const res = makeRes();
    validateToggleComplete(makeReq({ is_completed: 'true' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects number 1 instead of boolean', () => {
    const res = makeRes();
    validateToggleComplete(makeReq({ is_completed: 1 }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// validateCreateCategory
// ---------------------------------------------------------------------------
describe('validateCreateCategory', () => {
  let next;
  beforeEach(() => { next = jest.fn(); });

  it('passes with valid name', () => {
    const res = makeRes();
    validateCreateCategory(makeReq({ name: '업무' }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects missing name', () => {
    const res = makeRes();
    validateCreateCategory(makeReq({}), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects blank name', () => {
    const res = makeRes();
    validateCreateCategory(makeReq({ name: '  ' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// validateUpdateUser
// ---------------------------------------------------------------------------
describe('validateUpdateUser', () => {
  let next;
  beforeEach(() => { next = jest.fn(); });

  it('passes with name only', () => {
    const res = makeRes();
    validateUpdateUser(makeReq({ name: 'NewName' }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes with current_password and new_password(≥8)', () => {
    const res = makeRes();
    validateUpdateUser(makeReq({ current_password: 'OldPass1!', new_password: 'NewPass1!' }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes with empty body (no-op)', () => {
    const res = makeRes();
    validateUpdateUser(makeReq({}), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects blank name', () => {
    const res = makeRes();
    validateUpdateUser(makeReq({ name: '' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects new_password without current_password', () => {
    const res = makeRes();
    validateUpdateUser(makeReq({ new_password: 'NewPass1!' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects new_password shorter than 8 chars', () => {
    const res = makeRes();
    validateUpdateUser(makeReq({ current_password: 'OldPass1!', new_password: 'short' }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
