'use strict';

process.env.JWT_SECRET = 'test-secret-for-todo-get';

jest.mock('../../src/repositories/todo.repository');
jest.mock('../../src/repositories/category.repository');

const request = require('supertest');
const app = require('../../src/app');
const todoRepository = require('../../src/repositories/todo.repository');
const { signToken } = require('../../src/utils/jwt.utils');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

function makeTodo(overrides = {}) {
  return {
    id: 'todo-uuid-001',
    user_id: USER_ID,
    category_id: 'cat-uuid-001',
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

describe('GET /api/todos', () => {
  let token;

  beforeAll(() => { token = signToken(USER_ID); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('200 — returns array of todos', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([makeTodo(), makeTodo({ id: 'todo-2' })]);

    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it('200 — returns empty array when no todos', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('200 — passes category_id filter to repository (BR-F-01)', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await request(app)
      .get('/api/todos?category_id=cat-uuid-001')
      .set('Authorization', `Bearer ${token}`);

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ categoryId: 'cat-uuid-001' }),
    );
  });

  it('200 — passes is_completed=true filter (BR-F-03)', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await request(app)
      .get('/api/todos?is_completed=true')
      .set('Authorization', `Bearer ${token}`);

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ isCompleted: true }),
    );
  });

  it('200 — passes overdue=true filter (BR-F-02)', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await request(app)
      .get('/api/todos?overdue=true')
      .set('Authorization', `Bearer ${token}`);

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ overdue: true }),
    );
  });

  it('200 — applies multiple filters simultaneously (BR-F-04)', async () => {
    todoRepository.findByUserId.mockResolvedValueOnce([]);

    await request(app)
      .get('/api/todos?category_id=cat-1&is_completed=false&overdue=true')
      .set('Authorization', `Bearer ${token}`);

    expect(todoRepository.findByUserId).toHaveBeenCalledWith(USER_ID, {
      categoryId: 'cat-1',
      isCompleted: false,
      overdue: true,
    });
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });

  it('401 — invalid token', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', 'Bearer bad.token.here');
    expect(res.status).toBe(401);
  });
});
