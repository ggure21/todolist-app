'use strict';

process.env.JWT_SECRET = 'test-secret-for-todo-delete';

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

describe('DELETE /api/todos/:id', () => {
  let token;

  beforeAll(() => { token = signToken(USER_ID); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('200 — deletes todo and returns message', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo());
    todoRepository.deleteById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('할일이 삭제되었습니다.');
  });

  // -------------------------------------------------------------------------
  // 소유권 검증 (BR-T-03)
  // -------------------------------------------------------------------------
  it('403 — FORBIDDEN when todo belongs to other user', async () => {
    todoRepository.findById.mockResolvedValueOnce(makeTodo({ user_id: OTHER_ID }));

    const res = await request(app)
      .delete(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('404 — TODO_NOT_FOUND when todo does not exist', async () => {
    todoRepository.findById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete(`/api/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('TODO_NOT_FOUND');
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app)
      .delete(`/api/todos/${TODO_ID}`);

    expect(res.status).toBe(401);
  });

  it('401 — invalid token', async () => {
    const res = await request(app)
      .delete(`/api/todos/${TODO_ID}`)
      .set('Authorization', 'Bearer bad.token.here');

    expect(res.status).toBe(401);
  });
});
