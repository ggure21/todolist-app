'use strict';

const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('../../../src/utils/password.utils');

describe('password.utils', () => {
  // -------------------------------------------------------------------------
  // hashPassword
  // -------------------------------------------------------------------------
  describe('hashPassword(plain)', () => {
    it('should return a bcrypt hash string', async () => {
      const hash = await hashPassword('MySecret123!');
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('should use cost factor 10', async () => {
      const hash = await hashPassword('MySecret123!');
      const rounds = Number(hash.split('$')[2]);
      expect(rounds).toBe(10);
    });

    it('should produce different hashes for the same input (salted)', async () => {
      const hash1 = await hashPassword('samePassword');
      const hash2 = await hashPassword('samePassword');
      expect(hash1).not.toBe(hash2);
    });

    it('should never return the plain password', async () => {
      const plain = 'plaintext';
      const hash = await hashPassword(plain);
      expect(hash).not.toBe(plain);
    });
  });

  // -------------------------------------------------------------------------
  // comparePassword
  // -------------------------------------------------------------------------
  describe('comparePassword(plain, hashed)', () => {
    let hash;

    beforeAll(async () => {
      hash = await bcrypt.hash('CorrectPassword!', 10);
    });

    it('should return true when the plain password matches the hash', async () => {
      const result = await comparePassword('CorrectPassword!', hash);
      expect(result).toBe(true);
    });

    it('should return false when the plain password does not match the hash', async () => {
      const result = await comparePassword('WrongPassword!', hash);
      expect(result).toBe(false);
    });

    it('should return false for an empty string against a real hash', async () => {
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });

    it('should return false for a case-variant of the correct password', async () => {
      const result = await comparePassword('correctpassword!', hash);
      expect(result).toBe(false);
    });

    it('round-trip: hashPassword then comparePassword returns true', async () => {
      const plain = 'RoundTrip@2026';
      const generated = await hashPassword(plain);
      const result = await comparePassword(plain, generated);
      expect(result).toBe(true);
    });
  });
});
