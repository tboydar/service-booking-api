import { Context } from 'koa';
import { AuthService } from '../services/auth-service';
import { AppError } from '../middlewares/error-handler';
import type { RegisterRequest, LoginRequest } from '../validation/auth.schemas';

/**
 * Authentication controller for handling user registration and login endpoints
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService || new AuthService();
  }

  /**
   * Handle user registration
   * POST /auth/register
   */
  register = async (ctx: Context): Promise<void> => {
    try {
      const userData = ctx.request.body as RegisterRequest;

      const result = await this.authService.register(userData);

      ctx.status = 201;
      ctx.body = result;
    } catch (error: any) {
      // Handle service-specific errors
      if (error.message.startsWith('DUPLICATE_ERROR:')) {
        throw new AppError('DUPLICATE_ERROR', 'Email already exists', 409, {
          field: 'email',
        });
      }

      if (error.message.startsWith('VALIDATION_ERROR:')) {
        throw new AppError(
          'VALIDATION_ERROR',
          error.message.replace('VALIDATION_ERROR: ', ''),
          400
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  };

  /**
   * Handle user login
   * POST /auth/login
   */
  login = async (ctx: Context): Promise<void> => {
    try {
      const credentials = ctx.request.body as LoginRequest;

      const result = await this.authService.login(credentials);

      ctx.status = 200;
      ctx.body = result;
    } catch (error: any) {
      // Handle service-specific errors
      if (error.message.startsWith('AUTHENTICATION_ERROR:')) {
        throw new AppError(
          'AUTHENTICATION_ERROR',
          'Invalid email or password',
          401
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  };
}

export default AuthController;
