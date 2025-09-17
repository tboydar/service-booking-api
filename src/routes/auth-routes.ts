const Router = require('@koa/router');
import { AuthController } from '../controllers/auth-controller';
import { validateBody } from '../middlewares/validation';
import { registerSchema, loginSchema } from '../validation/auth.schemas';

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
  router.post('/register', validateBody(registerSchema), controller.register);

  /**
   * POST /auth/login
   * Login user
   */
  router.post('/login', validateBody(loginSchema), controller.login);

  return router;
};

// Default export for convenience
export const authRoutes = createAuthRoutes();
