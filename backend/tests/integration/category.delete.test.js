'use strict';

process.env.JWT_SECRET = 'test-secret-for-cat-delete';

jest.mock('../../src/repositories/category.repository');
jest.mock('../../src/repositories/todo.repository');

const request = require('supertest');
const app = require('../../src/app');
const categoryRepository = require('../../src/repositories/category.repository');
const { signToken } = require('../../src/utils/jwt.utils');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const OTHER_ID = 'a1b2c3d4-0000-0000-0000-000000000099';
const CAT_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789001';

const USER_CAT = { id: CAT_ID, user_id: USER_ID, name: '운동', is_default: false, created_at: new Date().toISOString() };
const DEFAULT_CAT = { id: CAT_ID, user_id: null, name: '업무', is_default: true, created_at: new Date().toISOString() };
const OTHER_CAT = { id: CAT_ID, user_id: OTHER_ID, name: '비공개', is_default: false, created_at: new Date().toISOString() };

describe('DELETE /api/categories/:id', () => {
  let token;

  beforeAll(() => { token = signToken(USER_ID); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('204 — deletes category successfully', async () => {
    categoryRepository.findById.mockResolvedValueOnce(USER_CAT);
    categoryRepository.countTodosByCategory.mockResolvedValueOnce(0);
    categoryRepository.deleteById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete(`/api/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  // -------------------------------------------------------------------------
  // 기본 카테고리 삭제 불가 (BR-C-01)
  // -------------------------------------------------------------------------
  it('400 — DEFAULT_CATEGORY_DELETE_NOT_ALLOWED for default category (BR-C-01)', async () => {
    categoryRepository.findById.mockResolvedValueOnce(DEFAULT_CAT);

    const res = await request(app)
      .delete(`/api/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DEFAULT_CATEGORY_DELETE_NOT_ALLOWED');
  });

  // -------------------------------------------------------------------------
  // 소유권 검증 (403)
  // -------------------------------------------------------------------------
  it('403 — FORBIDDEN when category belongs to other user', async () => {
    categoryRepository.findById.mockResolvedValueOnce(OTHER_CAT);

    const res = await request(app)
      .delete(`/api/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // -------------------------------------------------------------------------
  // 할일 있는 카테고리 삭제 불가 (BR-C-03)
  // -------------------------------------------------------------------------
  it('400 — CATEGORY_HAS_TODOS when category has associated todos (BR-C-03)', async () => {
    categoryRepository.findById.mockResolvedValueOnce(USER_CAT);
    categoryRepository.countTodosByCategory.mockResolvedValueOnce(2);

    const res = await request(app)
      .delete(`/api/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CATEGORY_HAS_TODOS');
  });

  // -------------------------------------------------------------------------
  // 카테고리 없음 (404)
  // -------------------------------------------------------------------------
  it('404 — CATEGORY_NOT_FOUND when category does not exist', async () => {
    categoryRepository.findById.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete(`/api/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CATEGORY_NOT_FOUND');
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app)
      .delete(`/api/categories/${CAT_ID}`);

    expect(res.status).toBe(401);
  });

  it('401 — invalid token', async () => {
    const res = await request(app)
      .delete(`/api/categories/${CAT_ID}`)
      .set('Authorization', 'Bearer bad.token.here');

    expect(res.status).toBe(401);
  });
});
