const Router = require('@koa/router');
import * as path from 'path';
import * as fs from 'fs/promises';
import { Context } from 'koa';

/**
 * Demo routes for reCAPTCHA showcase
 * Serves static HTML files for demonstration
 */
export const createDemoRoutes = (): any => {
  const router = new Router({ prefix: '/demo' });

  /**
   * Serve static HTML files from public/demo directory
   */
  router.get(['/', '/:path+'], async (ctx: Context) => {
    let filePath = ctx['params']['path'] || 'index.html';
    if (Array.isArray(filePath)) {
      filePath = filePath.join('/');
    }

    // Ensure .html extension
    if (!filePath.endsWith('.html') && !filePath.includes('.')) {
      filePath += '.html';
    }

    // Security: prevent directory traversal
    if (filePath.includes('..')) {
      ctx.status = 403;
      ctx.body = 'Forbidden';
      return;
    }

    const fullPath = path.join(process.cwd(), 'public', 'demo', filePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      ctx.type = 'text/html';
      ctx.body = content;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File not found, try index.html
        if (filePath !== 'index.html') {
          const indexPath = path.join(process.cwd(), 'public', 'demo', 'index.html');
          try {
            const indexContent = await fs.readFile(indexPath, 'utf-8');
            ctx.type = 'text/html';
            ctx.body = indexContent;
          } catch {
            ctx.status = 404;
            ctx.body = 'Page not found';
          }
        } else {
          ctx.status = 404;
          ctx.body = 'Demo page not found';
        }
      } else {
        console.error('Error serving demo file:', error);
        ctx.status = 500;
        ctx.body = 'Internal server error';
      }
    }
  });

  return router;
};

export const demoRoutes = createDemoRoutes();