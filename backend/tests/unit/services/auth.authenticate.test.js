'use strict';

process.env.JWT_SECRET = 'test-secret-for-auth-tests';

jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/utils/password.utils');

const userRepository = require('../../../src/repositories/user.repository');
const { comparePassword } = require('../../../src/utils/password.utils');
const { authenticateUser } = require('../../../src/services/auth.service');
const AppError = require('../../../src/utils/app-error');

const MOCK_USER = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  email: 'alice@example.com',
  password: '$2b$10$hashedpassword',
  name: 'Alice',
};

describe('authService.authenticateUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return accessToken when credentials are valid', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(true);

    const result = await authenticateUser('alice@example.com', 'correctpassword');

    expect(result).toHaveProperty('accessToken');
    expect(typeof result.accessToken).toBe('string');
  });

  it('accessToken payload should contain userId', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(true);

    const { accessToken } = await authenticateUser('alice@example.com', 'correctpassword');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(accessToken);
    expect(decoded.userId).toBe(MOCK_USER.id);
  });

  it('should throw AppError(401, INVALID_CREDENTIALS) when email does not exist', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(undefined);

    await expect(authenticateUser('nobody@example.com', 'password'))
      .rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });

    expect(comparePassword).not.toHaveBeenCalled();
  });

  it('should throw AppError(401, INVALID_CREDENTIALS) when password is wrong', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(false);

    await expect(authenticateUser('alice@example.com', 'wrongpassword'))
      .rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
  });

  it('should return the same error message for email-not-found and wrong-password (security)', async () => {
    const EXPECTED_MSG = '이메일 또는 비밀번호가 올바르지 않습니다.';

    userRepository.findByEmail.mockResolvedValueOnce(undefined);
    const err1 = await authenticateUser('nobody@example.com', 'pw').catch((e) => e);

    userRepository.findByEmail.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(false);
    const err2 = await authenticateUser('alice@example.com', 'wrong').catch((e) => e);

    expect(err1.message).toBe(EXPECTED_MSG);
    expect(err2.message).toBe(EXPECTED_MSG);
  });

  it('should throw an AppError instance', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(undefined);
    await expect(authenticateUser('x@x.com', 'pw')).rejects.toBeInstanceOf(AppError);
  });
});
