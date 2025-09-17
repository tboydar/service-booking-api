import { createAuthRoutes } from '../auth-routes';
import { AuthController } from '../../controllers/auth-controller';

describe('Auth Routes', () => {
  let mockAuthController: jest.Mocked<AuthController>;

  beforeEach(() => {
    mockAuthController = {
      register: jest.fn(),
      login: jest.fn(),
      authService: {} as any,
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuthRoutes', () => {
    it('應該建立認證路由', () => {
      // Act
      const router = createAuthRoutes(mockAuthController);

      // Assert
      expect(router).toBeDefined();
      expect(router.opts.prefix).toBe('/auth');
    });

    it('應該在沒有提供控制器時使用預設控制器', () => {
      // Act
      const router = createAuthRoutes();

      // Assert
      expect(router).toBeDefined();
      expect(router.opts.prefix).toBe('/auth');
    });
  });

  describe('路由端點', () => {
    it('應該有 POST /register 路由', () => {
      // Arrange
      const router = createAuthRoutes(mockAuthController);

      // Act
      const routes = router.stack;

      // Assert
      const registerRoute = routes.find(
        (route: any) =>
          route.path === '/auth/register' && route.methods.includes('POST')
      );
      expect(registerRoute).toBeDefined();
    });

    it('應該有 POST /login 路由', () => {
      // Arrange
      const router = createAuthRoutes(mockAuthController);

      // Act
      const routes = router.stack;

      // Assert
      const loginRoute = routes.find(
        (route: any) =>
          route.path === '/auth/login' && route.methods.includes('POST')
      );
      expect(loginRoute).toBeDefined();
    });
  });
});
