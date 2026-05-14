'use strict';

process.env.JWT_SECRET = 'test-secret-for-categories';

jest.mock('../../src/repositories/category.repository');

const request = require('supertest');
const app = require('../../src/app');
const categoryRepository = require('../../src/repositories/category.repository');
const { signToken } = require('../../src/utils/jwt.utils');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const DEFAULT_CATS = [
  { id: 'def-1', user_id: null, name: '개인', is_default: true, created_at: new Date('2026-01-01') },
  { id: 'def-2', user_id: null, name: '업무', is_default: true, created_at: new Date('2026-01-01') },
  { id: 'def-3', user_id: null, name: '쇼핑', is_default: true, created_at: new Date('2026-01-01') },
];
const USER_CAT = { id: 'usr-1', user_id: USER_ID, name: '운동', is_default: false, created_at: new Date('2026-05-01') };

describe('GET /api/categories', () => {
  let token;

  beforeAll(() => { token = signToken(USER_ID); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('200 — returns combined default + user categories', async () => {
    categoryRepository.findByUserIdAndDefault.mockResolvedValueOnce([...DEFAULT_CATS, USER_CAT]);

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(4);
  });

  it('200 — each category includes is_default field', async () => {
    categoryRepository.findByUserIdAndDefault.mockResolvedValueOnce([...DEFAULT_CATS, USER_CAT]);

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    res.body.forEach(cat => expect(cat).toHaveProperty('is_default'));
  });

  it('200 — returns only default categories when user has none', async () => {
    categoryRepository.findByUserIdAndDefault.mockResolvedValueOnce(DEFAULT_CATS);

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('200 — returns empty array when no categories found', async () => {
    categoryRepository.findByUserIdAndDefault.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('401 — invalid token', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', 'Bearer invalid.token');

    expect(res.status).toBe(401);
  });
});
