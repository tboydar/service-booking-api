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
  LOG_LEVEL: string;
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
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
};

export const isDevelopment = (): boolean => config.NODE_ENV === 'development';
export const isProduction = (): boolean => config.NODE_ENV === 'production';
export const isTest = (): boolean => config.NODE_ENV === 'test';
