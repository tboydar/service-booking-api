# Database Seeders

This directory contains database seed files that populate the database with initial test data for development and testing purposes.

## Seed Files

### 20250917000001-demo-users.js
Creates demo user accounts with the following test users:

| Email                  | Password    | Name       | Role      |
| ---------------------- | ----------- | ---------- | --------- |
| admin@example.com      | password123 | 系統管理員 | Admin     |
| john.doe@example.com   | admin123    | John Doe   | User      |
| jane.smith@example.com | user123     | Jane Smith | User      |
| test.user@example.com  | password123 | 測試使用者 | Test User |

**Note**: All passwords are hashed using bcrypt with 12 salt rounds as per security requirements.

### 20250917000002-demo-services.js
Creates demo appointment services with various configurations:

| Service Name | Price    | Duration | Order | Status                 |
| ------------ | -------- | -------- | ----- | ---------------------- |
| 快速檢測服務 | $800.00  | 30 min   | 0     | Public                 |
| 基礎健康檢查 | $1500.00 | 60 min   | 1     | Public                 |
| 專業諮詢服務 | $3000.00 | 90 min   | 2     | Public                 |
| 進階健康評估 | $5000.00 | 120 min  | 3     | Public                 |
| 私人定制服務 | $8000.00 | 180 min  | 4     | Private                |
| 已停用服務   | $1000.00 | 45 min   | 99    | Removed (Soft Deleted) |

## Usage

### Running Seeds

```bash
# Run all seeders
npm run seed

# Run seeders for specific environment
npm run seed:dev
npm run seed:test

# Undo all seeders
npm run seed:undo

# Fresh seed (undo then seed)
npm run seed:fresh
```

### Database Setup

```bash
# Complete database setup (migrate + seed)
npm run db:setup

# Reset database (undo migrations, migrate, seed)
npm run db:reset
```

### Validation and Verification

```bash
# Validate seed data format
npm run seed:validate

# Test seed data in database
npm run seed:test

# Verify seed data was inserted correctly
npm run seed:verify
```

## Seed Data Validation

All seed data is validated to ensure it meets the following requirements:

### User Data Validation
- ✅ Email format validation (valid email address)
- ✅ Password length validation (minimum 6 characters)
- ✅ Name length validation (2-255 characters)
- ✅ Password hashing with bcrypt (12 salt rounds)

### Service Data Validation
- ✅ Name length validation (1-255 characters)
- ✅ Description length validation (max 1000 characters)
- ✅ Price validation (non-negative integer in cents)
- ✅ ShowTime validation (non-negative integer)
- ✅ Order validation (non-negative integer)
- ✅ Boolean field validation (isRemove, isPublic)

## Development Guidelines

### Creating New Seeders

1. Generate a new seeder file:
   ```bash
   npm run seed:create -- demo-new-data
   ```

2. Follow the naming convention: `YYYYMMDDHHMMSS-description.js`

3. Ensure all data meets validation requirements

4. Test the seeder:
   ```bash
   npm run seed:validate
   npm run seed:test
   ```

### Best Practices

- **Use realistic test data** that represents actual use cases
- **Include edge cases** like soft-deleted records and private services
- **Hash passwords properly** using the same method as the application
- **Use UUIDs** for primary keys to match production behavior
- **Include both up and down methods** for proper rollback support
- **Test thoroughly** before committing new seeders

### Security Considerations

- **Never use real user data** in seed files
- **Use strong test passwords** but document them clearly
- **Hash all passwords** using the application's password utility
- **Don't commit sensitive information** to version control

## Troubleshooting

### Common Issues

1. **Validation Errors**: Run `npm run seed:validate` to check data format
2. **Database Connection**: Ensure database is initialized with `npm run db:init`
3. **Migration Issues**: Run migrations first with `npm run migrate`
4. **Duplicate Data**: Use `npm run seed:undo` before re-seeding

### Environment-Specific Issues

- **Development**: Use `npm run seed:dev` for development environment
- **Testing**: Use `npm run seed:test` for test environment
- **CI/CD**: Ensure proper environment variables are set

## Integration with Testing

The seed data is designed to work seamlessly with the test suite:

- **Unit Tests**: Use individual seed records for isolated testing
- **Integration Tests**: Use complete seed dataset for API testing
- **E2E Tests**: Reset and seed database before each test run

## Maintenance

- **Regular Updates**: Keep seed data current with schema changes
- **Performance**: Monitor seed execution time and optimize if needed
- **Documentation**: Update this README when adding new seeders
- **Validation**: Run validation tests after any changes