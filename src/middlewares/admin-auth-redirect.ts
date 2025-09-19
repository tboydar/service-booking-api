import { Context, Next } from 'koa';
import { verifyJWT } from './jwt-auth';

/**
 * Admin authentication middleware that redirects to login page on failure
 * Used for HTML page routes
 */
export async function adminAuthWithRedirect(ctx: Context, next: Next): Promise<void> {
  try {
    // Get token from cookie first, then header
    let token: string | undefined;

    // Try to get from cookie
    const cookieToken = ctx.cookies.get('adminToken');
    if (cookieToken) {
      token = cookieToken;
    } else {
      // Try to get from header
      const authHeader = ctx.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      // No token, redirect to login
      ctx.redirect('/admin/login');
      return;
    }

    // Verify token
    const payload = verifyJWT(token);

    if (!payload || typeof payload === 'string') {
      // Invalid token, redirect to login
      ctx.redirect('/admin/login');
      return;
    }

    // Check if user has admin role
    const user = payload as any;
    if (user.role !== 'admin') {
      // Not an admin, redirect to login
      ctx.redirect('/admin/login');
      return;
    }

    // Attach user to context
    ctx.state['user'] = user;
    await next();
  } catch (error) {
    // Any error, redirect to login
    ctx.redirect('/admin/login');
  }
}