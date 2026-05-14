'use strict';

process.env.JWT_SECRET = 'test-secret-for-login-integration';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/utils/password.utils');

const request = require('supertest');
const app = require('../../src/app');
const userRepository = require('../../src/repositories/user.repository');
const { comparePassword } = require('../../src/utils/password.utils');

const MOCK_USER = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  email: 'alice@example.com',
  password: '$2b$10$hashedpassword',
  name: 'Alice',
};

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 성공
  // -------------------------------------------------------------------------
  it('200 — returns accessToken on valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('accessToken is a valid JWT (3-part structure)', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'correctpassword' });

    expect(res.body.accessToken.split('.')).toHaveLength(3);
  });

  // -------------------------------------------------------------------------
  // 인증 실패 (401)
  // -------------------------------------------------------------------------
  it('401 — INVALID_CREDENTIALS when email does not exist', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('401 — INVALID_CREDENTIALS when password is wrong', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('same error message for email-not-found vs wrong-password', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(undefined);
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'pw12345678' });

    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(false);
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });

    expect(res1.body.message).toBe(res2.body.message);
  });

  // -------------------------------------------------------------------------
  // 입력 검증 실패 (400)
  // -------------------------------------------------------------------------
  it('400 — VALIDATION_ERROR when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when body is empty', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // -------------------------------------------------------------------------
  // 응답에 민감 정보 미포함
  // -------------------------------------------------------------------------
  it('success response does not expose password hash', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'correctpassword' });

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('name');
  });
});
