import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';
import { environment } from '../config/environment';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extend Koa Context to include user information
declare module 'koa' {
  interface Context {
    user?: JWTPayload;
  }
}

export const jwtAuth = async (ctx: Context, next: Next): Promise<void> => {
  const authHeader = ctx.headers.authorization;

  if (!authHeader) {
    throw new AppError(
      'AUTHENTICATION_ERROR',
      'Authorization header is required',
      401
    );
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError(
      'AUTHENTICATION_ERROR',
      'Invalid authorization header format. Expected: Bearer <token>',
      401
    );
  }

  const token = parts[1];

  if (!token) {
    throw new AppError('AUTHENTICATION_ERROR', 'Token is required', 401);
  }

  try {
    const decoded = jwt.verify(token, environment.JWT_SECRET) as JWTPayload;

    // Add user information to context
    ctx.user = decoded;

    // Continue to next middleware - don't catch errors from downstream middleware
    await next();
  } catch (jwtError: any) {
    // Only handle JWT-specific errors here
    if (jwtError && jwtError.name === 'TokenExpiredError') {
      throw new AppError('AUTHENTICATION_ERROR', 'Token has expired', 401);
    }

    if (jwtError && jwtError.name === 'JsonWebTokenError') {
      throw new AppError('AUTHENTICATION_ERROR', 'Invalid token', 401);
    }

    // If it's not a JWT error, re-throw it as-is (could be validation error, etc.)
    throw jwtError;
  }
};

export const optionalJwtAuth = async (
  ctx: Context,
  next: Next
): Promise<void> => {
  try {
    const authHeader = ctx.headers.authorization;

    if (!authHeader) {
      // No auth header, continue without user context
      await next();
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without user context
      await next();
      return;
    }

    const token = parts[1];

    if (!token) {
      // No token, continue without user context
      await next();
      return;
    }

    try {
      const decoded = jwt.verify(token, environment.JWT_SECRET) as JWTPayload;
      ctx.user = decoded;
    } catch (jwtError) {
      // Invalid token, continue without user context
      // Don't throw error for optional auth
    }

    await next();
  } catch (error) {
    // For optional auth, continue even if there's an error
    await next();
  }
};

export const generateJWT = (
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string => {
  return jwt.sign(payload, environment.JWT_SECRET, {
    expiresIn: '24h',
  });
};

export const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, environment.JWT_SECRET) as JWTPayload;
};
