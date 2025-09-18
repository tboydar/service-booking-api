import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  DATABASE_DIALECT: string;
  DATABASE_STORAGE: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;
  CORS_ORIGIN: string;
  ALLOWED_ORIGINS?: string | undefined;
  LOG_LEVEL: string;
  RATE_LIMIT_ENABLED: boolean;
  RATE_LIMIT_DB_PATH: string;
  RATE_LIMIT_GENERAL_POINTS: number;
  RATE_LIMIT_STRICT_POINTS: number;
  RATE_LIMIT_API_POINTS: number;
  RATE_LIMIT_DURATION: number;
  RECAPTCHA_ENABLED: boolean;
  RECAPTCHA_SITE_KEY: string;
  RECAPTCHA_SECRET_KEY: string;
  RECAPTCHA_VERIFY_URL: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  const numValue = value ? parseInt(value, 10) : defaultValue!;
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return numValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

export const config: EnvironmentConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', 3000),
  DATABASE_URL: getEnvVar('DATABASE_URL', 'sqlite:./database.sqlite'),
  DATABASE_DIALECT: getEnvVar('DATABASE_DIALECT', 'sqlite'),
  DATABASE_STORAGE: getEnvVar('DATABASE_STORAGE', './database.sqlite'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '24h'),
  BCRYPT_ROUNDS: getEnvNumber('BCRYPT_ROUNDS', 12),
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  ALLOWED_ORIGINS: process.env['ALLOWED_ORIGINS'],
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  RATE_LIMIT_ENABLED: getEnvBoolean('RATE_LIMIT_ENABLED', true),
  RATE_LIMIT_DB_PATH: getEnvVar('RATE_LIMIT_DB_PATH', './ratelimit.sqlite'),
  RATE_LIMIT_GENERAL_POINTS: getEnvNumber('RATE_LIMIT_GENERAL_POINTS', 100),
  RATE_LIMIT_STRICT_POINTS: getEnvNumber('RATE_LIMIT_STRICT_POINTS', 5),
  RATE_LIMIT_API_POINTS: getEnvNumber('RATE_LIMIT_API_POINTS', 60),
  RATE_LIMIT_DURATION: getEnvNumber('RATE_LIMIT_DURATION', 60),
  RECAPTCHA_ENABLED: getEnvBoolean('RECAPTCHA_ENABLED', true),
  RECAPTCHA_SITE_KEY: getEnvVar('RECAPTCHA_SITE_KEY', '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'),
  RECAPTCHA_SECRET_KEY: getEnvVar('RECAPTCHA_SECRET_KEY', '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'),
  RECAPTCHA_VERIFY_URL: getEnvVar('RECAPTCHA_VERIFY_URL', 'https://www.google.com/recaptcha/api/siteverify'),
};

// Export as environment for easier access
export const environment = config;

export const isDevelopment = (): boolean => config.NODE_ENV === 'development';
export const isProduction = (): boolean => config.NODE_ENV === 'production';
export const isTest = (): boolean => config.NODE_ENV === 'test';
