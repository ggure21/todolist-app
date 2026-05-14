'use strict';

process.env.JWT_SECRET = 'test-secret-for-todo-toggle';

jest.mock('../../src/repositories/todo.repository');
jest.mock('../../src/repositories/category.repository');

const request = require('supertest');
const app = require('../../src/app');
const todoRepository = require('../../src/repositories/todo.repository');
const { signToken } = require('../../src/utils/jwt.utils');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const OTHER_ID = 'a1b2c3d4-0000-0000-0000-000000000099';
const TODO_ID = 'todo-uuid-001';

function makeTodo(overrides = {}) {
  return {
    id: TODO_ID,
    user_id: USER_ID,
    category_id: 'cat-default',
    title: '할일',
    description: null,
    due_date: null,
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('PATCH /api/todos/:id/toggle', () => {
  let token;

  beforeAll(() => { token = signToken(USER_ID); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('200 — marks todo as completed, completed_at set (BR-T-04)', async () => {
    const completedAt = new Date().toISOString();
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ is_completed: false }));
    todoRepository.toggleComplete.mockResolvedValueOnce(
      makeTodo({ is_completed: true, completed_at: completedAt }),
    );

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_completed: true });

    expect(res.status).toBe(200);
    expect(res.body.is_completed).toBe(true);
    expect(res.body.completed_at).toBe(completedAt);
  });

  it('200 — marks todo as incomplete, completed_at cleared (BR-T-05)', async () => {
    todoRepository.findById.mockResolvedValueOnce(
      makeTodo({ is_completed: true, completed_at: new Date().toISOString() }),
    );
    todoRepository.toggleComplete.mockResolvedValueOnce(
      makeTodo({ is_completed: false, completed_at: null }),
    );

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_completed: false });

    expect(res.status).toBe(200);
    expect(res.body.is_completed).toBe(false);
    expect(res.body.completed_at).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 소유권 검증 (BR-T-03)
  // -------------------------------------------------------------------------
  it('403 — FORBIDDEN when todo belongs to other user', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_completed: true });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('404 — TODO_NOT_FOUND when todo does not exist', async () => {
    todoRepository.findById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_completed: true });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('TODO_NOT_FOUND');
  });

  // -------------------------------------------------------------------------
  // 입력 검증
  // -------------------------------------------------------------------------
  it('400 — VALIDATION_ERROR when is_completed is missing', async () => {
    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when is_completed is a string', async () => {
    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_completed: 'true' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}/complete`)
      .send({ is_completed: true });

    expect(res.status).toBe(401);
  });

  it('401 — invalid token', async () => {
    const res = await request(app)
      .patch(`/api/todos/${TODO_ID}/complete`)
      .set('Authorization', 'Bearer bad.token.here')
      .send({ is_completed: true });

    expect(res.status).toBe(401);
  });
});
