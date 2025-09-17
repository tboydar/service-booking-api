import * as jwt from 'jsonwebtoken';
import { config } from '../config/environment';

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT utility functions for token generation and verification
 */
export class JWTUtils {
  /**
   * Generate a JWT token for a user
   * @param userId - User ID to include in token
   * @param email - User email to include in token
   * @returns string - JWT token
   */
  static generateToken(userId: string, email: string): string {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }

    if (!email || typeof email !== 'string') {
      throw new Error('Email must be a non-empty string');
    }

    try {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId,
        email,
      };

      // Use type assertion to bypass TypeScript issues
      const token = (jwt.sign as any)(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN,
      });

      return token as string;
    } catch (error) {
      throw new Error(
        `Failed to generate JWT token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token to verify
   * @returns JWTPayload - Decoded token payload
   */
  static verifyToken(token: string): JWTPayload {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error(
          `Failed to verify JWT token: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value (Bearer <token>)
   * @returns string | null - Extracted token or null if invalid format
   */
  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1] || null;
  }

  /**
   * Check if a token is expired without throwing an error
   * @param token - JWT token to check
   * @returns boolean - True if token is expired, false otherwise
   */
  static isTokenExpired(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return true;
    }

    try {
      jwt.verify(token, config.JWT_SECRET);
      return false;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return true;
      }
      // For other errors (invalid token, etc.), consider as expired
      return true;
    }
  }

  /**
   * Decode token without verification (for debugging purposes)
   * @param token - JWT token to decode
   * @returns any - Decoded token payload (unverified)
   */
  static decodeToken(token: string): any {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(
        `Failed to decode JWT token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
