import { Context, Next } from 'koa';
import { environment } from '../config/environment';

export interface CorsOptions {
  origin?: string | string[] | ((ctx: Context) => string | Promise<string>);
  allowMethods?: string | string[];
  allowHeaders?: string | string[];
  exposeHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  optionsSuccessStatus?: number;
}

const defaultOptions: CorsOptions = {
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Mx-ReqToken',
    'Keep-Alive',
    'X-Requested-With',
    'If-Modified-Since',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

export const cors = (
  options: CorsOptions = {}
): ((ctx: Context, next: Next) => Promise<void>) => {
  const opts = { ...defaultOptions, ...options };

  return async (ctx: Context, next: Next): Promise<void> => {
    // Handle preflight requests
    if (ctx.method === 'OPTIONS') {
      ctx.status = opts.optionsSuccessStatus || 204;
      ctx.body = '';
    }

    // Set origin
    let origin = opts.origin;
    if (typeof origin === 'function') {
      origin = await origin(ctx);
    }

    if (Array.isArray(origin)) {
      const requestOrigin = ctx.headers.origin;
      if (requestOrigin && origin.includes(requestOrigin)) {
        ctx.set('Access-Control-Allow-Origin', requestOrigin);
      }
    } else if (origin === '*') {
      ctx.set('Access-Control-Allow-Origin', '*');
    } else if (typeof origin === 'string') {
      ctx.set('Access-Control-Allow-Origin', origin);
    }

    // Set credentials
    if (opts.credentials) {
      ctx.set('Access-Control-Allow-Credentials', 'true');
    }

    // Set allowed methods
    if (opts.allowMethods) {
      const methods = Array.isArray(opts.allowMethods)
        ? opts.allowMethods.join(',')
        : opts.allowMethods;
      ctx.set('Access-Control-Allow-Methods', methods);
    }

    // Set allowed headers
    if (opts.allowHeaders) {
      const headers = Array.isArray(opts.allowHeaders)
        ? opts.allowHeaders.join(',')
        : opts.allowHeaders;
      ctx.set('Access-Control-Allow-Headers', headers);
    }

    // Set exposed headers
    if (opts.exposeHeaders) {
      const headers = Array.isArray(opts.exposeHeaders)
        ? opts.exposeHeaders.join(',')
        : opts.exposeHeaders;
      ctx.set('Access-Control-Expose-Headers', headers);
    }

    // Set max age
    if (opts.maxAge) {
      ctx.set('Access-Control-Max-Age', opts.maxAge.toString());
    }

    // Continue to next middleware if not OPTIONS request
    if (ctx.method !== 'OPTIONS') {
      await next();
    }
  };
};

// Development CORS configuration
export const developmentCors = cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
});

// Production CORS configuration
export const productionCors = cors({
  origin: (ctx: Context) => {
    // In production, you should specify allowed origins
    const allowedOrigins = environment.ALLOWED_ORIGINS?.split(',') || [];
    const requestOrigin = ctx.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }

    return allowedOrigins[0] || 'https://yourdomain.com';
  },
  credentials: true,
});

// Get appropriate CORS middleware based on environment
export const getCorsMiddleware = () => {
  return environment.NODE_ENV === 'production'
    ? productionCors
    : developmentCors;
};
