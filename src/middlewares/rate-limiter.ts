import { Context, Next } from 'koa';
import { RateLimiterSQLite } from 'rate-limiter-flexible';
import * as sqlite3 from 'sqlite3';
import { config } from '../config/environment';
import { AppError } from './error-handler';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Rate limiter instances
 */
let generalRateLimiter: RateLimiterSQLite | null = null;
let strictRateLimiter: RateLimiterSQLite | null = null;
let apiRateLimiter: RateLimiterSQLite | null = null;

/**
 * SQLite database instance for rate limiting
 */
let rateLimitDb: sqlite3.Database | null = null;

/**
 * Initialize rate limiters
 */
export const initializeRateLimiters = (): void => {
  if (!config.RATE_LIMIT_ENABLED) {
    console.log('Rate limiting is disabled');
    return;
  }

  try {
    // Ensure directory exists
    const dbDir = path.dirname(config.RATE_LIMIT_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize SQLite database
    rateLimitDb = new sqlite3.Database(config.RATE_LIMIT_DB_PATH, (err) => {
      if (err) {
        console.error('Failed to open rate limit database:', err);
        throw err;
      }
    });

    // Create table if not exists
    rateLimitDb.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        points INTEGER DEFAULT 0,
        expire INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_expire ON rate_limits(expire);
    `, (err) => {
      if (err) {
        console.error('Failed to create rate limit table:', err);
        throw err;
      }
    });

    // Initialize general rate limiter (100 requests per minute)
    generalRateLimiter = new RateLimiterSQLite({
      storeClient: rateLimitDb,
      keyPrefix: 'general',
      points: config.RATE_LIMIT_GENERAL_POINTS,
      duration: config.RATE_LIMIT_DURATION,
      blockDuration: config.RATE_LIMIT_DURATION,
      tableName: 'rate_limits',
    });

    // Initialize strict rate limiter for auth endpoints (5 requests per minute)
    strictRateLimiter = new RateLimiterSQLite({
      storeClient: rateLimitDb,
      keyPrefix: 'strict',
      points: config.RATE_LIMIT_STRICT_POINTS,
      duration: config.RATE_LIMIT_DURATION,
      blockDuration: config.RATE_LIMIT_DURATION * 2, // Double block duration for strict
      tableName: 'rate_limits',
    });

    // Initialize API rate limiter (60 requests per minute)
    apiRateLimiter = new RateLimiterSQLite({
      storeClient: rateLimitDb,
      keyPrefix: 'api',
      points: config.RATE_LIMIT_API_POINTS,
      duration: config.RATE_LIMIT_DURATION,
      blockDuration: config.RATE_LIMIT_DURATION,
      tableName: 'rate_limits',
    });

    console.log('✅ Rate limiters initialized successfully');
    console.log(`📁 Rate limit database: ${config.RATE_LIMIT_DB_PATH}`);
  } catch (error) {
    console.error('Failed to initialize rate limiters:', error);
    throw error;
  }
};

/**
 * Clean up expired rate limit records
 */
export const cleanupExpiredRecords = (): void => {
  if (!rateLimitDb) return;

  try {
    const now = Date.now();
    rateLimitDb.run(
      'DELETE FROM rate_limits WHERE expire < ? AND expire IS NOT NULL',
      [now],
      function(err) {
        if (err) {
          console.error('Failed to clean up expired records:', err);
        } else if (this.changes > 0) {
          console.log(`Cleaned up ${this.changes} expired rate limit records`);
        }
      }
    );
  } catch (error) {
    console.error('Failed to clean up expired records:', error);
  }
};

/**
 * Get client IP address
 */
const getClientIp = (ctx: Context): string => {
  return (
    ctx.request.ip ||
    ctx.request.headers['x-forwarded-for'] as string ||
    ctx.request.headers['x-real-ip'] as string ||
    ctx.request.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Check if IP is whitelisted
 */
const isWhitelisted = (ip: string): boolean => {
  const whitelist = ['127.0.0.1', '::1', 'localhost'];
  return whitelist.includes(ip);
};

/**
 * General rate limiter middleware
 */
export const generalRateLimit = async (ctx: Context, next: Next): Promise<void> => {
  if (!config.RATE_LIMIT_ENABLED || !generalRateLimiter) {
    return await next();
  }

  const ip = getClientIp(ctx);

  // Skip rate limiting for whitelisted IPs in development
  if (config.NODE_ENV === 'development' && isWhitelisted(ip)) {
    return await next();
  }

  try {
    const rateLimiterRes = await generalRateLimiter.consume(ip);

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', config.RATE_LIMIT_GENERAL_POINTS.toString());
    ctx.set('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
    ctx.set('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

    await next();
  } catch (rateLimiterRes: any) {
    // Rate limit exceeded
    ctx.set('X-RateLimit-Limit', config.RATE_LIMIT_GENERAL_POINTS.toString());
    ctx.set('X-RateLimit-Remaining', '0');
    ctx.set('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
    ctx.set('Retry-After', Math.round(rateLimiterRes.msBeforeNext / 1000).toString());

    throw new AppError(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later',
      429,
      {
        retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000),
      }
    );
  }
};

/**
 * Strict rate limiter middleware for sensitive endpoints
 */
export const strictRateLimit = async (ctx: Context, next: Next): Promise<void> => {
  if (!config.RATE_LIMIT_ENABLED || !strictRateLimiter) {
    return await next();
  }

  const ip = getClientIp(ctx);

  // Skip rate limiting for whitelisted IPs in development
  if (config.NODE_ENV === 'development' && isWhitelisted(ip)) {
    return await next();
  }

  try {
    const rateLimiterRes = await strictRateLimiter.consume(ip);

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', config.RATE_LIMIT_STRICT_POINTS.toString());
    ctx.set('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
    ctx.set('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

    await next();
  } catch (rateLimiterRes: any) {
    // Rate limit exceeded
    ctx.set('X-RateLimit-Limit', config.RATE_LIMIT_STRICT_POINTS.toString());
    ctx.set('X-RateLimit-Remaining', '0');
    ctx.set('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
    ctx.set('Retry-After', Math.round(rateLimiterRes.msBeforeNext / 1000).toString());

    throw new AppError(
      'RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts, please try again later',
      429,
      {
        retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000),
      }
    );
  }
};

/**
 * API rate limiter middleware
 */
export const apiRateLimit = async (ctx: Context, next: Next): Promise<void> => {
  if (!config.RATE_LIMIT_ENABLED || !apiRateLimiter) {
    return await next();
  }

  const ip = getClientIp(ctx);

  // Skip rate limiting for whitelisted IPs in development
  if (config.NODE_ENV === 'development' && isWhitelisted(ip)) {
    return await next();
  }

  try {
    const rateLimiterRes = await apiRateLimiter.consume(ip);

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', config.RATE_LIMIT_API_POINTS.toString());
    ctx.set('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
    ctx.set('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

    await next();
  } catch (rateLimiterRes: any) {
    // Rate limit exceeded
    ctx.set('X-RateLimit-Limit', config.RATE_LIMIT_API_POINTS.toString());
    ctx.set('X-RateLimit-Remaining', '0');
    ctx.set('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
    ctx.set('Retry-After', Math.round(rateLimiterRes.msBeforeNext / 1000).toString());

    throw new AppError(
      'RATE_LIMIT_EXCEEDED',
      'API rate limit exceeded, please try again later',
      429,
      {
        retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000),
      }
    );
  }
};

/**
 * Close rate limiter database connection
 */
export const closeRateLimiters = (): void => {
  if (rateLimitDb) {
    rateLimitDb.close();
    rateLimitDb = null;
    console.log('Rate limiter database connection closed');
  }
};

// Schedule periodic cleanup (every hour)
if (config.RATE_LIMIT_ENABLED) {
  setInterval(cleanupExpiredRecords, 60 * 60 * 1000);
}