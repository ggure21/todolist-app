'use strict';

jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/utils/password.utils');

const userRepository = require('../../../src/repositories/user.repository');
const { comparePassword, hashPassword } = require('../../../src/utils/password.utils');
const { updateMe } = require('../../../src/services/user.service');
const AppError = require('../../../src/utils/app-error');

const MOCK_USER = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  email: 'alice@example.com',
  password: '$2b$10$hashedpassword',
  name: 'Alice',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
};

describe('userService.updateMe', () => {
  beforeEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // 이름 변경
  // -------------------------------------------------------------------------
  it('should update name and return user without password', async () => {
    const updatedRow = { ...MOCK_USER, name: 'NewName' };
    userRepository.updateUser.mockResolvedValueOnce(updatedRow);

    const result = await updateMe(MOCK_USER.id, { name: 'NewName' });

    expect(userRepository.updateUser).toHaveBeenCalledWith(MOCK_USER.id, { name: 'NewName' });
    expect(result.name).toBe('NewName');
    expect(result).not.toHaveProperty('password');
  });

  // -------------------------------------------------------------------------
  // 비밀번호 변경
  // -------------------------------------------------------------------------
  it('should update password when current_password matches', async () => {
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(true);
    hashPassword.mockResolvedValueOnce('$2b$10$newhash');
    const updatedRow = { ...MOCK_USER, password: '$2b$10$newhash' };
    userRepository.updateUser.mockResolvedValueOnce(updatedRow);

    const result = await updateMe(MOCK_USER.id, {
      current_password: 'oldpassword',
      new_password: 'newpassword123',
    });

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      MOCK_USER.id,
      { password: '$2b$10$newhash' },
    );
    expect(result).not.toHaveProperty('password');
  });

  it('should throw AppError(400, WRONG_CURRENT_PASSWORD) when current password is wrong', async () => {
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(false);

    await expect(updateMe(MOCK_USER.id, {
      current_password: 'wrongpassword',
      new_password: 'newpassword123',
    })).rejects.toMatchObject({ statusCode: 400, code: 'WRONG_CURRENT_PASSWORD' });

    expect(userRepository.updateUser).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 이메일 변경 시도 (BR-U-04)
  // -------------------------------------------------------------------------
  it('should throw AppError(400, EMAIL_CHANGE_NOT_ALLOWED) when email field is present', async () => {
    await expect(updateMe(MOCK_USER.id, { email: 'new@example.com' }))
      .rejects.toMatchObject({ statusCode: 400, code: 'EMAIL_CHANGE_NOT_ALLOWED' });

    expect(userRepository.updateUser).not.toHaveBeenCalled();
  });

  it('EMAIL_CHANGE_NOT_ALLOWED even when other valid fields are included', async () => {
    await expect(updateMe(MOCK_USER.id, { name: 'New', email: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'EMAIL_CHANGE_NOT_ALLOWED' });
  });

  // -------------------------------------------------------------------------
  // 빈 body (no-op) → fallback to findById
  // -------------------------------------------------------------------------
  it('should return current user when no fields to update', async () => {
    userRepository.updateUser.mockResolvedValueOnce(null);
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);

    const result = await updateMe(MOCK_USER.id, {});

    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe(MOCK_USER.email);
  });

  // -------------------------------------------------------------------------
  // 이름 + 비밀번호 동시 변경
  // -------------------------------------------------------------------------
  it('should update both name and password simultaneously', async () => {
    userRepository.findById.mockResolvedValueOnce(MOCK_USER);
    comparePassword.mockResolvedValueOnce(true);
    hashPassword.mockResolvedValueOnce('$2b$10$newhash');
    const updatedRow = { ...MOCK_USER, name: 'NewName', password: '$2b$10$newhash' };
    userRepository.updateUser.mockResolvedValueOnce(updatedRow);

    const result = await updateMe(MOCK_USER.id, {
      name: 'NewName',
      current_password: 'oldpassword',
      new_password: 'newpassword123',
    });

    expect(userRepository.updateUser).toHaveBeenCalledWith(
      MOCK_USER.id,
      { name: 'NewName', password: '$2b$10$newhash' },
    );
    expect(result.name).toBe('NewName');
    expect(result).not.toHaveProperty('password');
  });
});
