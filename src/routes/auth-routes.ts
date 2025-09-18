const Router = require('@koa/router');
import { AuthController } from '../controllers/auth-controller';
import { validateBody } from '../middlewares/validation';
import { registerSchema, loginSchema } from '../validation/auth.schemas';
import { strictRateLimit } from '../middlewares/rate-limiter';

/**
 * Authentication routes
 * Handles user registration and login endpoints
 */
export const createAuthRoutes = (authController?: AuthController): any => {
  const router = new Router({ prefix: '/auth' });
  const controller = authController || new AuthController();

  /**
   * POST /auth/register
   * Register a new user
   */
  router.post('/register', strictRateLimit, validateBody(registerSchema), controller.register);

  /**
   * POST /auth/login
   * Login user
   */
  router.post('/login', strictRateLimit, validateBody(loginSchema), controller.login);

  return router;
};

// Default export for convenience
export const authRoutes = createAuthRoutes();
