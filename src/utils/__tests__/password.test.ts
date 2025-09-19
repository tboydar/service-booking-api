import { PasswordUtils } from '../password';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('PasswordUtils', () => {
  const bcrypt = require('bcrypt');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('應該成功雜湊密碼', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$12$hashedPasswordExample';

      bcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await PasswordUtils.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('當密碼為空字串時應該拋出錯誤', async () => {
      await expect(PasswordUtils.hashPassword('')).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('當密碼不是字串時應該拋出錯誤', async () => {
      await expect(PasswordUtils.hashPassword(null as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );

      await expect(
        PasswordUtils.hashPassword(undefined as any)
      ).rejects.toThrow('Password must be a non-empty string');

      await expect(PasswordUtils.hashPassword(123 as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('當 bcrypt.hash 失敗時應該拋出錯誤', async () => {
      const password = 'testPassword123';
      const error = new Error('Bcrypt error');

      bcrypt.hash.mockRejectedValue(error);

      await expect(PasswordUtils.hashPassword(password)).rejects.toThrow(
        'Failed to hash password: Bcrypt error'
      );
    });
  });

  describe('verifyPassword', () => {
    it('當密碼正確時應該回傳 true', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$12$hashedPasswordExample';

      bcrypt.compare.mockResolvedValue(true);

      const result = await PasswordUtils.verifyPassword(
        password,
        hashedPassword
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('當密碼錯誤時應該回傳 false', async () => {
      const password = 'wrongPassword';
      const hashedPassword = '$2b$12$hashedPasswordExample';

      bcrypt.compare.mockResolvedValue(false);

      const result = await PasswordUtils.verifyPassword(
        password,
        hashedPassword
      );

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('當密碼為空字串時應該拋出錯誤', async () => {
      const hashedPassword = '$2b$12$hashedPasswordExample';

      await expect(
        PasswordUtils.verifyPassword('', hashedPassword)
      ).rejects.toThrow('Password must be a non-empty string');
    });

    it('當雜湊密碼為空字串時應該拋出錯誤', async () => {
      const password = 'testPassword123';

      await expect(PasswordUtils.verifyPassword(password, '')).rejects.toThrow(
        'Hashed password must be a non-empty string'
      );
    });

    it('當參數不是字串時應該拋出錯誤', async () => {
      const hashedPassword = '$2b$12$hashedPasswordExample';

      await expect(
        PasswordUtils.verifyPassword(null as any, hashedPassword)
      ).rejects.toThrow('Password must be a non-empty string');

      await expect(
        PasswordUtils.verifyPassword('password', null as any)
      ).rejects.toThrow('Hashed password must be a non-empty string');
    });

    it('當 bcrypt.compare 失敗時應該拋出錯誤', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$12$hashedPasswordExample';
      const error = new Error('Bcrypt compare error');

      bcrypt.compare.mockRejectedValue(error);

      await expect(
        PasswordUtils.verifyPassword(password, hashedPassword)
      ).rejects.toThrow('Failed to verify password: Bcrypt compare error');
    });
  });

  describe('isValidPassword', () => {
    it('當密碼長度大於等於 6 個字元時應該回傳 true', () => {
      expect(PasswordUtils.isValidPassword('123456')).toBe(true);
      expect(PasswordUtils.isValidPassword('password123')).toBe(true);
      expect(PasswordUtils.isValidPassword('verylongpassword')).toBe(true);
    });

    it('當密碼長度小於 6 個字元時應該回傳 false', () => {
      expect(PasswordUtils.isValidPassword('12345')).toBe(false);
      expect(PasswordUtils.isValidPassword('abc')).toBe(false);
      expect(PasswordUtils.isValidPassword('1')).toBe(false);
    });

    it('當密碼為空字串時應該回傳 false', () => {
      expect(PasswordUtils.isValidPassword('')).toBe(false);
    });

    it('當密碼不是字串時應該回傳 false', () => {
      expect(PasswordUtils.isValidPassword(null as any)).toBe(false);
      expect(PasswordUtils.isValidPassword(undefined as any)).toBe(false);
      expect(PasswordUtils.isValidPassword(123 as any)).toBe(false);
      expect(PasswordUtils.isValidPassword({} as any)).toBe(false);
    });
  });
});
