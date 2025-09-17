#!/usr/bin/env ts-node

/**
 * Database seeder runner utility
 * This script provides a programmatic way to run seeders with proper environment setup
 */

import { execSync } from 'child_process';
import { config } from '../config/environment';
import { initializeDatabase } from './init';

/**
 * Run database seeders
 * @param environment - Environment to run seeders for (development, test, production)
 */
export async function runSeeders(
  environment: string = 'development'
): Promise<void> {
  try {
    console.log(`🌱 Running seeders for ${environment} environment...`);

    // Set NODE_ENV for the seeder command
    const env = { ...process.env, NODE_ENV: environment };

    // Run seeders using sequelize-cli
    execSync('npx sequelize-cli db:seed:all', {
      stdio: 'inherit',
      env,
    });

    console.log('✅ Seeders completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    throw error;
  }
}

/**
 * Undo all seeders
 * @param environment - Environment to undo seeders for
 */
export async function undoSeeders(
  environment: string = 'development'
): Promise<void> {
  try {
    console.log(`🔄 Undoing seeders for ${environment} environment...`);

    // Set NODE_ENV for the seeder command
    const env = { ...process.env, NODE_ENV: environment };

    // Undo seeders using sequelize-cli
    execSync('npx sequelize-cli db:seed:undo:all', {
      stdio: 'inherit',
      env,
    });

    console.log('✅ Seeders undone successfully!');
  } catch (error) {
    console.error('❌ Error undoing seeders:', error);
    throw error;
  }
}

/**
 * Initialize database and run seeders
 * This is useful for setting up a fresh development environment
 */
export async function initializeWithSeeds(): Promise<void> {
  try {
    console.log('🚀 Initializing database with seeds...');

    // Initialize database (run migrations)
    await initializeDatabase();

    // Run seeders
    await runSeeders();

    console.log('✅ Database initialized with seed data successfully!');
  } catch (error) {
    console.error('❌ Error initializing database with seeds:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const environment = process.argv[3] || config.NODE_ENV;

  switch (command) {
    case 'seed':
      runSeeders(environment).catch(error => {
        console.error('Failed to run seeders:', error);
        process.exit(1);
      });
      break;

    case 'undo':
      undoSeeders(environment).catch(error => {
        console.error('Failed to undo seeders:', error);
        process.exit(1);
      });
      break;

    case 'init':
      initializeWithSeeds().catch(error => {
        console.error('Failed to initialize with seeds:', error);
        process.exit(1);
      });
      break;

    default:
      console.log(`
Usage: ts-node src/database/seed-runner.ts <command> [environment]

Commands:
  seed    Run all seeders
  undo    Undo all seeders
  init    Initialize database and run seeders

Environment: development (default), test, production

Examples:
  ts-node src/database/seed-runner.ts seed
  ts-node src/database/seed-runner.ts seed test
  ts-node src/database/seed-runner.ts undo
  ts-node src/database/seed-runner.ts init
      `);
      process.exit(1);
  }
}
