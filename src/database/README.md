# Database Setup

This directory contains database-related files and utilities for the service booking API.

## Structure

- `connection.ts` - Database connection management with retry logic and health checks
- `index.ts` - Database manager and initialization with environment-specific setup
- `database-utils.ts` - Utility functions for database operations and statistics
- `init.ts` - Database initialization, verification, and health checks
- `migration-utils.ts` - Helper utilities for creating safe migrations
- `setup-verification.ts` - Comprehensive database setup verification
- `migrations/` - Database migration files (Sequelize CLI)
- `seeders/` - Database seed files for initial/test data

## Quick Start

### Initialize Database
```bash
npm run db:init
```

### Check Database Health
```bash
npm run db:health
```

### View Database Statistics
```bash
npm run db:stats
```

### Run Verification
```bash
npm run db:verify
```

## Migration Management

### Create New Migration
```bash
npm run migrate:create -- migration-name
```

### Run Migrations
```bash
npm run migrate
```

### Check Migration Status
```bash
npm run migrate:status
```

### Rollback Last Migration
```bash
npm run migrate:undo
```

## Seed Management

### Create New Seed
```bash
npm run seed:create -- seed-name
```

### Run All Seeds
```bash
npm run seed
```

### Rollback All Seeds
```bash
npm run seed:undo
```

## Environment Configuration

### Environment Variables
- `DATABASE_STORAGE` - SQLite database file path (default: `./database.sqlite`)
- `NODE_ENV` - Environment (development/test/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

### Environment-Specific Behavior
- **Development**: Uses file-based SQLite, enables model sync, detailed logging
- **Test**: Uses in-memory SQLite, no logging, automatic cleanup
- **Production**: Uses file-based SQLite, no model sync, minimal logging

## Database Architecture

### Connection Management
- Singleton pattern for connection management
- Automatic retry logic with configurable attempts
- Connection pooling for optimal performance
- Health checks with response time monitoring

### Migration System
- Safe migration utilities with existence checks
- Standardized column definitions (UUID, timestamps, etc.)
- Automatic index creation for common query patterns
- Rollback support for all schema changes

### Utilities
- Table/column/index existence checking
- Database statistics and performance monitoring
- SQLite-specific operations (VACUUM, file size)
- Raw query execution with error handling

## Development Guidelines

### Migration Best Practices
1. Always use migration utilities from `migration-utils.ts`
2. Include both `up` and `down` methods
3. Test migrations in both directions
4. Use descriptive migration names
5. Add indexes for frequently queried columns

### Example Migration
```javascript
const { MigrationUtils } = require('../migration-utils');

module.exports = {
  async up(queryInterface, Sequelize) {
    await MigrationUtils.createUsersTable(queryInterface);
  },

  async down(queryInterface, Sequelize) {
    await MigrationUtils.dropTableSafely(queryInterface, 'Users');
  }
};
```

### Seeding Guidelines
1. Use seeds for initial data and development fixtures
2. Make seeds idempotent (can be run multiple times)
3. Include proper error handling
4. Use realistic test data

## Programmatic Usage

### Initialize Database
```typescript
import { databaseManager } from './database';

await databaseManager.initialize();
```

### Test Connection
```typescript
import { databaseConnection } from './database/connection';

const status = await databaseConnection.testConnection();
console.log('Connected:', status.isConnected);
```

### Get Database Info
```typescript
import { databaseManager } from './database';

const info = await databaseManager.getDatabaseInfo();
console.log('Database info:', info);
```

## Features

- ✅ SQLite database configuration with environment-specific settings
- ✅ Robust connection management with retry logic
- ✅ Comprehensive migration system with safe utilities
- ✅ Seed system for data management
- ✅ Health checks and performance monitoring
- ✅ Database statistics and information gathering
- ✅ Error handling and detailed logging
- ✅ Connection pooling and optimization
- ✅ Environment-specific behavior (dev/test/prod)
- ✅ Automatic database initialization and verification

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check database file permissions
   - Verify storage path exists
   - Increase timeout in connection options

2. **Migration Failures**
   - Check migration syntax
   - Verify table/column names
   - Review migration order

3. **Performance Issues**
   - Run `VACUUM` on SQLite database
   - Check for missing indexes
   - Monitor query performance

### Debug Commands
```bash
# Test database connection
npm run db:health

# View database information
npm run db:stats

# Initialize with debug logging
LOG_LEVEL=debug npm run db:init

# Check migration status
npm run migrate:status

# Run comprehensive verification
npm run db:verify
```