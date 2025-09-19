import * as bcrypt from 'bcrypt';
import { config } from '../config/environment';

/**
 * Password utility functions for hashing and verification
 */
export class PasswordUtils {
  /**
   * Hash a plain text password using bcrypt
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    try {
      const saltRounds = config.BCRYPT_ROUNDS;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error(
        `Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify a plain text password against a hashed password
   * @param password - Plain text password to verify
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise<boolean> - True if password matches, false otherwise
   */
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Hashed password must be a non-empty string');
    }

    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error(
        `Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a password meets minimum requirements
   * @param password - Password to validate
   * @returns boolean - True if password meets requirements
   */
  static isValidPassword(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Minimum 6 characters as per requirements
    return password.length >= 6;
  }
}

// Export convenience functions
export const hashPassword = PasswordUtils.hashPassword;
export const verifyPassword = PasswordUtils.verifyPassword;
export const validatePassword = PasswordUtils.verifyPassword; // Alias for compatibility
export const isValidPassword = PasswordUtils.isValidPassword;
