'use strict';

process.env.JWT_SECRET = 'test-secret-for-updateme';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/utils/password.utils');

const request = require('supertest');
const app = require('../../src/app');
const userRepository = require('../../src/repositories/user.repository');
const { comparePassword, hashPassword } = require('../../src/utils/password.utils');
const { signToken } = require('../../src/utils/jwt.utils');

const MOCK_USER = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  email: 'alice@example.com',
  password: '$2b$10$hashedpassword',
  name: 'Alice',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-02T00:00:00.000Z'),
};

describe('PATCH /api/users/me', () => {
  let token;

  beforeAll(() => { token = signToken(MOCK_USER.id); });
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 이름 변경
  // -------------------------------------------------------------------------
  it('200 — updates name successfully', async () => {
    const updated = { ...MOCK_USER, name: '김길동' };
    userRepository.updateUser.mockResolvedValueOnce(updated);

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '김길동' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('김길동');
    expect(res.body).not.toHaveProperty('password');
  });

  // -------------------------------------------------------------------------
  // 비밀번호 변경
  // -------------------------------------------------------------------------
  it('200 — updates password when current_password is correct', async () => {
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(true);
    hashPassword.mockResolvedValueOnce('$2b$10$newhash');
    const updated = { ...MOCK_USER, password: '$2b$10$newhash' };
    userRepository.updateUser.mockResolvedValueOnce(updated);

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'currentpassword', new_password: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('password');
  });

  // -------------------------------------------------------------------------
  // 이메일 변경 시도 (BR-U-04)
  // -------------------------------------------------------------------------
  it('400 — EMAIL_CHANGE_NOT_ALLOWED when email field is included', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'newemail@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('EMAIL_CHANGE_NOT_ALLOWED');
  });

  // -------------------------------------------------------------------------
  // 현재 비밀번호 불일치
  // -------------------------------------------------------------------------
  it('400 — WRONG_CURRENT_PASSWORD when current password is incorrect', async () => {
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(false);

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'wrongpassword', new_password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('WRONG_CURRENT_PASSWORD');
  });

  // -------------------------------------------------------------------------
  // 입력 검증 (validateUpdateUser)
  // -------------------------------------------------------------------------
  it('400 — VALIDATION_ERROR when new_password provided without current_password', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ new_password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 — VALIDATION_ERROR when new_password is shorter than 8 chars', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'current123', new_password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  // -------------------------------------------------------------------------
  // 미인증 (401)
  // -------------------------------------------------------------------------
  it('401 — no Authorization header', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .send({ name: 'NewName' });

    expect(res.status).toBe(401);
  });
});
