# E2E Testing with LambdaTest

This directory contains the end-to-end (E2E) testing infrastructure for the Service Booking API, integrated with LambdaTest's cloud testing platform for testing on real devices and browsers.

## 📁 Directory Structure

```
e2e/
├── config/
│   ├── lambdatest.config.ts    # LambdaTest configuration
│   ├── global-setup.ts         # Global test setup
│   └── global-teardown.ts      # Global test cleanup
├── tests/
│   ├── auth.e2e.test.ts        # Authentication flow tests
│   ├── services.e2e.test.ts    # Service management tests
│   ├── api-health.e2e.test.ts  # API health and infrastructure tests
│   └── complete-flow.e2e.test.ts # Complete workflow tests
├── utils/
│   └── api-helper.ts           # API testing utilities
└── fixtures/
    └── (test data files)
```

## 🚀 Quick Start

### 1. Setup LambdaTest Account

1. Sign up at [LambdaTest](https://accounts.lambdatest.com/register)
2. Get your username and access key from [Security Settings](https://accounts.lambdatest.com/security)
3. Copy `.env.e2e.example` to `.env.e2e` and update the credentials:

```bash
cp .env.e2e.example .env.e2e
```

```env
LT_USERNAME=your_lambdatest_username
LT_ACCESS_KEY=your_lambdatest_access_key
USE_LAMBDATEST=true
```

### 2. Install Dependencies

```bash
npm install
npx playwright install
```

### 3. Run E2E Tests

```bash
# Local testing (recommended for development)
npm run test:e2e:local

# LambdaTest cloud testing
npm run test:e2e:lambdatest

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View test reports
npm run test:e2e:report
```

## 🧪 Test Categories

### Authentication Tests (`auth.e2e.test.ts`)
- User registration flow
- Login/logout functionality
- JWT token validation
- Error handling for invalid credentials

### Service Management Tests (`services.e2e.test.ts`)
- Create, read, update, delete services
- Service validation
- Authorization checks
- Error handling

### API Health Tests (`api-health.e2e.test.ts`)
- Health check endpoints
- CORS configuration
- Rate limiting
- Performance testing

### Complete Flow Tests (`complete-flow.e2e.test.ts`)
- End-to-end user workflows
- Multi-user scenarios
- Integration between different modules
- Real-world usage patterns

## 🌐 LambdaTest Integration

### Supported Platforms

The tests run on multiple browser/OS combinations:

- **Chrome on Windows 10**
- **Chrome on macOS Big Sur**
- **Firefox on Ubuntu 22.04**
- **Edge on Windows 11**

### Features Used

- **Real Device Testing**: Tests run on actual devices, not simulators
- **Network Monitoring**: Capture network requests and responses
- **Video Recording**: Automatic video recording of test sessions
- **Console Logs**: Capture browser console logs for debugging
- **Cross-Browser Testing**: Ensure compatibility across different browsers

### LambdaTest Dashboard

Access your test results at: https://automation.lambdatest.com/

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LT_USERNAME` | LambdaTest username | - |
| `LT_ACCESS_KEY` | LambdaTest access key | - |
| `USE_LAMBDATEST` | Enable LambdaTest testing | `false` |
| `API_BASE_URL` | API server URL | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `test` |

### Custom Configuration

You can customize the LambdaTest configuration in `config/lambdatest.config.ts`:

```typescript
// Add new browser/OS combinations
{
  name: 'safari-macos',
  use: {
    connectOptions: {
      wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify({
        'browserName': 'Safari',
        'browserVersion': 'latest',
        'LT:Options': {
          'platform': 'macOS Monterey',
          // ... other options
        }
      }))}`,
    }
  }
}
```

## 📊 CI/CD Integration

The E2E tests are integrated into the CI/CD pipeline via GitHub Actions (`.github/workflows/e2e-tests.yml`):

### Pipeline Stages

1. **Unit Tests**: Run existing Jest unit tests
2. **Local E2E Tests**: Run E2E tests locally in CI
3. **LambdaTest E2E Tests**: Run tests on real devices (main branch only)
4. **Deploy**: Deploy only after all tests pass

### Secrets Configuration

Configure these secrets in your GitHub repository:

- `LT_USERNAME`: Your LambdaTest username
- `LT_ACCESS_KEY`: Your LambdaTest access key

## 🛠️ Development Guide

### Writing New Tests

1. **Create a new test file** in `e2e/tests/`
2. **Use the ApiTestHelper** for common API operations
3. **Follow naming conventions**: `*.e2e.test.ts`
4. **Include proper test descriptions** and error handling

Example:

```typescript
import { test, expect } from '@playwright/test';
import { ApiTestHelper } from '../utils/api-helper';

test.describe('My Feature E2E Tests', () => {
  let apiHelper: ApiTestHelper;

  test.beforeEach(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
  });

  test('should perform my feature test', async () => {
    // Test implementation
  });
});
```

### Best Practices

1. **Keep tests isolated**: Each test should be independent
2. **Use test data generators**: Create unique test data for each run
3. **Clean up resources**: Ensure tests don't leave side effects
4. **Test error scenarios**: Include both success and failure cases
5. **Use descriptive names**: Make test intentions clear

### Debugging

```bash
# Run specific test
npx playwright test auth.e2e.test.ts

# Run with debug mode
npm run test:e2e:debug

# Run headed (with browser UI)
npm run test:e2e:headed

# View test trace
npx playwright show-trace trace.zip
```

## 📈 Monitoring and Reports

### Test Reports

- **HTML Report**: Visual test results with screenshots and videos
- **JUnit Report**: XML format for CI/CD integration
- **JSON Report**: Machine-readable test results

### LambdaTest Analytics

- **Test Session Videos**: Watch recordings of your test runs
- **Performance Metrics**: Analyze test execution times
- **Error Logs**: Debug failed tests with detailed logs
- **Usage Statistics**: Monitor testing quota and usage

## 🚨 Troubleshooting

### Common Issues

#### LambdaTest Connection Failed
```bash
Error: WebSocket connection failed
```
**Solution**: Check your LT_USERNAME and LT_ACCESS_KEY credentials

#### API Server Not Responding
```bash
Error: ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Ensure the API server is running before E2E tests

#### Test Timeout
```bash
Error: Test timeout of 30000ms exceeded
```
**Solution**: Increase timeout in test configuration or optimize API response times

### Debug Commands

```bash
# Check LambdaTest connection
curl -u "$LT_USERNAME:$LT_ACCESS_KEY" \
  https://api.lambdatest.com/automation/api/v1/platforms

# Test API connectivity
curl http://localhost:3000/health

# Validate environment
npm run test:e2e:local -- --headed
```

## 📚 Additional Resources

- [LambdaTest Documentation](https://www.lambdatest.com/support/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [Service Booking API Documentation](../README.md)

## 🤝 Contributing

When contributing E2E tests:

1. Ensure tests pass both locally and on LambdaTest
2. Update documentation for new test categories
3. Follow the existing code structure and patterns
4. Include appropriate error handling and cleanup

---

**Note**: LambdaTest testing consumes automation minutes from your plan. For development, prefer running tests locally with `npm run test:e2e:local`.