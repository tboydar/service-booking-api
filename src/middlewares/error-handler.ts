import { Context, Next } from 'koa';

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

export const errorHandler = async (ctx: Context, next: Next): Promise<void> => {
  try {
    await next();
  } catch (error: any) {
    const timestamp = new Date().toISOString();

    // Handle known application errors
    if (error instanceof AppError) {
      ctx.status = error.statusCode;
      ctx.body = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp,
      } as ApiError;
      return;
    }

    // Handle Joi validation errors
    if (error && error.isJoi) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        },
        timestamp,
      } as ApiError;
      return;
    }

    // Handle Sequelize errors
    if (error && error.name === 'SequelizeValidationError') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Database validation failed',
          details: error.errors.map((err: any) => ({
            field: err.path,
            message: err.message,
          })),
        },
        timestamp,
      } as ApiError;
      return;
    }

    if (error && error.name === 'SequelizeUniqueConstraintError') {
      ctx.status = 409;
      ctx.body = {
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Resource already exists',
          details: error.errors.map((err: any) => ({
            field: err.path,
            message: err.message,
          })),
        },
        timestamp,
      } as ApiError;
      return;
    }

    // Handle JWT errors
    if (error && error.name === 'JsonWebTokenError') {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid token',
        },
        timestamp,
      } as ApiError;
      return;
    }

    if (error && error.name === 'TokenExpiredError') {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Token expired',
        },
        timestamp,
      } as ApiError;
      return;
    }

    // Log unexpected errors
    console.error('Unexpected error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp,
    });

    // Handle unexpected errors
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp,
    } as ApiError;
  }
};

export const createSuccessResponse = <T>(data: T): ApiSuccess<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});
