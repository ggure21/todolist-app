'use strict';

process.env.JWT_SECRET = 'test-secret-for-getme';

jest.mock('../../src/repositories/user.repository');

const request = require('supertest');
const app = require('../../src/app');
const userRepository = require('../../src/repositories/user.repository');
const { signToken } = require('../../src/utils/jwt.utils');

const MOCK_USER = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  email: 'alice@example.com',
  password: '$2b$10$hashedpassword',
  name: 'Alice',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
};

describe('GET /api/users/me', () => {
  let validToken;

  beforeAll(() => {
    validToken = signToken(MOCK_USER.id);
  });

  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('200 — returns user info for authenticated request', async () => {
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: MOCK_USER.id,
      email: MOCK_USER.email,
      name: MOCK_USER.name,
    });
  });

  it('200 — response does not include password', async () => {
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.body).not.toHaveProperty('password');
  });

  it('200 — response includes id, email, name, created_at, updated_at', async () => {
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('created_at');
    expect(res.body).toHaveProperty('updated_at');
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('401 — invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });

  it('401 — expired token', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign({ userId: MOCK_USER.id }, process.env.JWT_SECRET, { expiresIn: '-1s' });

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});
