import { Context, Next } from 'koa';
import { verifyJWT } from './jwt-auth';

export async function adminAuth(ctx: Context, next: Next): Promise<void> {
  try {
    // Get token from header
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      };
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = verifyJWT(token);

    if (!payload || typeof payload === 'string') {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      };
      return;
    }

    // Check if user has admin role
    const user = payload as any;
    if (user.role !== 'admin') {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      };
      return;
    }

    // Attach user to context
    ctx.state['user'] = user;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = {
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    };
  }
}