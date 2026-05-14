'use strict';

process.env.JWT_SECRET = 'test-secret-for-todo-create';

jest.mock('../../src/repositories/todo.repository');
jest.mock('../../src/repositories/category.repository');

const request = require('supertest');
const app = require('../../src/app');
const todoRepository = require('../../src/repositories/todo.repository');
const categoryRepository = require('../../src/repositories/category.repository');
const { signToken } = require('../../src/utils/jwt.utils');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const DEFAULT_CAT = { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', user_id: null, name: '업무', is_default: true };
const OTHER_CAT = { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', user_id: 'other-user', name: '비공개', is_default: false };

const NEW_TODO = {
  id: 'todo-uuid-001',
  user_id: USER_ID,
  category_id: DEFAULT_CAT.id,
  title: '보고서 작성',
  description: null,
  due_date: null,
  is_completed: false,
  completed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const FUTURE_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
})();

describe('POST /api/todos', () => {
  let token;

  beforeAll(() => { token = signToken(USER_ID); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('201 — creates todo with required fields only', async () => {
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);
    todoRepository.insertTodo.mockResolvedValueOnce(NEW_TODO);

    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '보고서 작성', category_id: DEFAULT_CAT.id });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: '보고서 작성', is_completed: false });
  });

  it('201 — creates todo with all optional fields', async () => {
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);
    const fullTodo = { ...NEW_TODO, description: '상세설명', due_date: FUTURE_DATE };
    todoRepository.insertTodo.mockResolvedValueOnce(fullTodo);

    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '보고서 작성', category_id: DEFAULT_CAT.id, description: '상세설명', due_date: FUTURE_DATE });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('상세설명');
  });

  // -------------------------------------------------------------------------
  // 카테고리 권한 (BR-C-02)
  // -------------------------------------------------------------------------
  it('404 — CATEGORY_NOT_FOUND when category does not exist', async () => {
    categoryRepository.findById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '할일', category_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678902' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('403 — CATEGORY_ACCESS_FORBIDDEN when category belongs to other user', async () => {
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT);

    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '할일', category_id: OTHER_CAT.id });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CATEGORY_ACCESS_FORBIDDEN');
  });

  // -------------------------------------------------------------------------
  // 입력 검증 (validateCreateTodo)
  // -------------------------------------------------------------------------
  it('400 — VALIDATION_ERROR when title is missing', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: DEFAULT_CAT.id });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when category_id is missing', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '할일' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when due_date is in the past (BR-T-06)', async () => {
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();

    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '할일', category_id: DEFAULT_CAT.id, due_date: yesterday });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: '할일', category_id: DEFAULT_CAT.id });

    expect(res.status).toBe(401);
  });
});
