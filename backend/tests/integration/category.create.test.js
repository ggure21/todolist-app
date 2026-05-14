'use strict';

process.env.JWT_SECRET = 'test-secret-for-cat-create';

jest.mock('../../src/repositories/category.repository');

const request = require('supertest');
const app = require('../../src/app');
const categoryRepository = require('../../src/repositories/category.repository');
const { signToken } = require('../../src/utils/jwt.utils');

const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const NEW_CAT = {
  id: 'new-cat-uuid',
  user_id: USER_ID,
  name: '운동',
  is_default: false,
  created_at: new Date('2026-05-13T10:00:00.000Z'),
};

describe('POST /api/categories', () => {
  let token;

  beforeAll(() => { token = signToken(USER_ID); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('201 — returns created category on valid input', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce(undefined);
    categoryRepository.insertCategory.mockResolvedValueOnce(NEW_CAT);

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '운동' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: NEW_CAT.id,
      name: '운동',
      is_default: false,
    });
  });

  it('201 — response includes id, user_id, name, is_default, created_at', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce(undefined);
    categoryRepository.insertCategory.mockResolvedValueOnce(NEW_CAT);

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '운동' });

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('is_default');
    expect(res.body).toHaveProperty('created_at');
  });

  // -------------------------------------------------------------------------
  // 이름 중복 (BR-C-04)
  // -------------------------------------------------------------------------
  it('400 — CATEGORY_NAME_DUPLICATE when name already exists', async () => {
    categoryRepository.findByUserIdAndName.mockResolvedValueOnce({ id: 'existing' });

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '운동' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CATEGORY_NAME_DUPLICATE');
  });

  // -------------------------------------------------------------------------
  // 입력 검증 (validateCreateCategory)
  // -------------------------------------------------------------------------
  it('400 — VALIDATION_ERROR when name is missing', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when name is blank', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: '운동' });

    expect(res.status).toBe(401);
  });
});
