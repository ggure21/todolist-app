'use strict';

process.env.JWT_SECRET = 'test-secret-for-todo-update';

jest.mock('../../src/repositories/todo.repository');
jest.mock('../../src/repositories/category.repository');

const request = require('supertest');
const app = require('../../src/app');
const todoRepository = require('../../src/repositories/todo.repository');
const categoryRepository = require('../../src/repositories/category.repository');
const { signToken } = require('../../src/utils/jwt.utils');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const OTHER_ID = 'a1b2c3d4-0000-0000-0000-000000000099';
const TODO_ID = 'todo-uuid-001';

const DEFAULT_CAT = { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', user_id: null, name: '업무', is_default: true };
const USER_CAT = { id: 'c3d4e5f6-a7b8-9012-cdef-123456789013', user_id: USER_ID, name: '운동', is_default: false };
const OTHER_CAT = { id: 'c3d4e5f6-a7b8-9012-cdef-123456789014', user_id: OTHER_ID, name: '비공개', is_default: false };

const FUTURE_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
})();

function makeTodo(overrides = {}) {
  return {
    id: TODO_ID,
    user_id: USER_ID,
    category_id: DEFAULT_CAT.id,
    title: '기존 할일',
    description: null,
    due_date: null,
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('PATCH /api/todos/:id', () => {
  let token;

  beforeAll(() => { token = signToken(USER_ID); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('200 — updates title', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    todoRepository.updateTodo.mockResolvedValueOnce(makeTodo({ title: '수정된 할일' }));

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '수정된 할일' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('수정된 할일');
  });

  it('200 — updates due_date to future date', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    todoRepository.updateTodo.mockResolvedValueOnce(makeTodo({ due_date: FUTURE_DATE }));

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ due_date: FUTURE_DATE });

    expect(res.status).toBe(200);
    expect(res.body.due_date).toBe(FUTURE_DATE);
  });

  it('200 — updates category_id to own category', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    categoryRepository.findById.mockResolvedValueOnce(USER_CAT);
    todoRepository.updateTodo.mockResolvedValueOnce(makeTodo({ category_id: USER_CAT.id }));

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: USER_CAT.id });

    expect(res.status).toBe(200);
    expect(res.body.category_id).toBe(USER_CAT.id);
  });

  it('200 — updates category_id to default category', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);
    todoRepository.updateTodo.mockResolvedValueOnce(makeTodo({ category_id: DEFAULT_CAT.id }));

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: DEFAULT_CAT.id });

    expect(res.status).toBe(200);
  });

  // -------------------------------------------------------------------------
  // 소유권 검증 (BR-T-03)
  // -------------------------------------------------------------------------
  it('403 — FORBIDDEN when todo belongs to other user', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '수정' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('404 — TODO_NOT_FOUND when todo does not exist', async () => {
    todoRepository.findById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '수정' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('TODO_NOT_FOUND');
  });

  // -------------------------------------------------------------------------
  // 카테고리 권한 (BR-C-02)
  // -------------------------------------------------------------------------
  it('403 — CATEGORY_ACCESS_FORBIDDEN when changing to other user category', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT);

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: OTHER_CAT.id });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CATEGORY_ACCESS_FORBIDDEN');
  });

  it('404 — CATEGORY_NOT_FOUND when changing to nonexistent category', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    categoryRepository.findById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: 'c3d4e5f6-a7b8-9012-cdef-123456789099' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CATEGORY_NOT_FOUND');
  });

  // -------------------------------------------------------------------------
  // 입력 검증 (BR-T-06)
  // -------------------------------------------------------------------------
  it('400 — VALIDATION_ERROR when due_date is in the past', async () => {
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ due_date: yesterday });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when title is empty string', async () => {
    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when category_id is invalid UUID format', async () => {
    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: 'not-a-uuid' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .send({ title: '수정' });

    expect(res.status).toBe(401);
  });

  it('401 — invalid token', async () => {
    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}`)
      .set('Authorization', 'Bearer bad.token.here')
      .send({ title: '수정' });

    expect(res.status).toBe(401);
  });
});
