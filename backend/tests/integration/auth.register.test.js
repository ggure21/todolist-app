'use strict';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/utils/password.utils');

const request = require('supertest');
const app = require('../../src/app');
const userRepository = require('../../src/repositories/user.repository');
const { hashPassword } = require('../../src/utils/password.utils');

const VALID_BODY = {
  email: 'alice@example.com',
  password: 'password123',
  name: 'Alice',
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 성공 케이스
  // -------------------------------------------------------------------------
  it('201 — returns success message on valid input', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(undefined);
    hashPassword.mockResolvedValueOnce('$2b$10$hashed');
    userRepository.insertUser.mockResolvedValueOnce({ id: 'uuid-001', ...VALID_BODY });

    const res = await request(app).post('/api/auth/register').send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: '회원가입이 완료되었습니다.' });
  });

  // -------------------------------------------------------------------------
  // 이메일 중복 (BR-U-01)
  // -------------------------------------------------------------------------
  it('400 — EMAIL_DUPLICATE when email already exists', async () => {
    userRepository.findByEmail.mockResolvedValueOnce({ id: 'existing' });

    const res = await request(app).post('/api/auth/register').send(VALID_BODY);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('EMAIL_DUPLICATE');
  });

  // -------------------------------------------------------------------------
  // 입력 검증 실패 (validateRegister)
  // -------------------------------------------------------------------------
  it('400 — VALIDATION_ERROR when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123', name: 'Alice' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'Alice' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when password is shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: '1234567', name: 'Alice' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when body is empty', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // -------------------------------------------------------------------------
  // 응답 형식 확인
  // -------------------------------------------------------------------------
  it('success response does not include password field', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(undefined);
    hashPassword.mockResolvedValueOnce('$2b$10$hashed');
    userRepository.insertUser.mockResolvedValueOnce({ id: 'uuid-001' });

    const res = await request(app).post('/api/auth/register').send(VALID_BODY);

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('accessToken');
  });
});
