import { Context, Next } from 'koa';
import Joi from 'joi';

export interface ValidationOptions {
  stripUnknown?: boolean;
  allowUnknown?: boolean;
  abortEarly?: boolean;
}

const defaultOptions: ValidationOptions = {
  stripUnknown: true,
  allowUnknown: false,
  abortEarly: false,
};

export const validateBody = (
  schema: Joi.Schema,
  options: ValidationOptions = {}
) => {
  return async (ctx: Context, next: Next): Promise<void> => {
    const validationOptions = { ...defaultOptions, ...options };

    try {
      const { error, value } = schema.validate(
        ctx.request.body,
        validationOptions
      );

      if (error) {
        throw error;
      }

      // Replace the body with validated and potentially transformed data
      ctx.request.body = value;
      await next();
    } catch (validationError: any) {
      // Only handle Joi validation errors here
      // Let other errors (like AppError from controllers) pass through
      if (validationError && validationError.isJoi) {
        throw validationError;
      }

      // Re-throw non-Joi errors as-is
      throw validationError;
    }
  };
};

export const validateParams = (
  schema: Joi.Schema,
  options: ValidationOptions = {}
) => {
  return async (ctx: Context, next: Next): Promise<void> => {
    const validationOptions = { ...defaultOptions, ...options };

    try {
      const { error, value } = schema.validate(
        (ctx as any).params,
        validationOptions
      );

      if (error) {
        throw error;
      }

      // Replace the params with validated data
      (ctx as any).params = value;
      await next();
    } catch (validationError: any) {
      // Only handle Joi validation errors here
      if (validationError && validationError.isJoi) {
        throw validationError;
      }

      // Re-throw non-Joi errors as-is
      throw validationError;
    }
  };
};

export const validateQuery = (
  schema: Joi.Schema,
  options: ValidationOptions = {}
) => {
  return async (ctx: Context, next: Next): Promise<void> => {
    const validationOptions = { ...defaultOptions, ...options };

    try {
      const { error, value } = schema.validate(
        (ctx as any).query,
        validationOptions
      );

      if (error) {
        throw error;
      }

      // Replace the query with validated data
      (ctx as any).query = value;
      await next();
    } catch (validationError: any) {
      // Only handle Joi validation errors here
      if (validationError && validationError.isJoi) {
        throw validationError;
      }

      // Re-throw non-Joi errors as-is
      throw validationError;
    }
  };
};

// Common parameter schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};
