import { Context } from 'koa';
import { AuthController } from '../auth-controller';
import { AuthService } from '../../services/auth-service';
import { AppError } from '../../middlewares/error-handler';

// Mock the AuthService
jest.mock('../../services/auth-service');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    // Create mock AuthService methods
    const mockRegister = jest.fn();
    const mockLogin = jest.fn();
    const mockHashPassword = jest.fn();
    const mockVerifyPassword = jest.fn();
    const mockGenerateJWT = jest.fn();

    // Create mock service instance
    mockAuthService = {
      register: mockRegister,
      login: mockLogin,
      hashPassword: mockHashPassword,
      verifyPassword: mockVerifyPassword,
      generateJWT: mockGenerateJWT,
    } as any;

    // Create controller with mocked service
    authController = new AuthController(mockAuthService);

    // Create mock context
    mockContext = {
      request: {
        body: {},
      } as any,
      status: 200,
      body: null,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const mockRegisterResponse = {
      success: true as const,
      data: {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    it('應該成功註冊新使用者', async () => {
      // Arrange
      mockContext.request!.body = validRegisterData;
      mockAuthService.register.mockResolvedValue(mockRegisterResponse);

      // Act
      await authController.register(mockContext as Context);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterData);
      expect(mockContext.status).toBe(201);
      expect(mockContext.body).toEqual(mockRegisterResponse);
    });

    it('當 email 已存在時應該拋出 DUPLICATE_ERROR', async () => {
      // Arrange
      mockContext.request!.body = validRegisterData;
      mockAuthService.register.mockRejectedValue(
        new Error('DUPLICATE_ERROR: Email already exists')
      );

      // Act & Assert
      await expect(
        authController.register(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await authController.register(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('DUPLICATE_ERROR');
        expect((error as AppError).statusCode).toBe(409);
        expect((error as AppError).message).toBe('Email already exists');
      }
    });

    it('當密碼驗證失敗時應該拋出 VALIDATION_ERROR', async () => {
      // Arrange
      mockContext.request!.body = validRegisterData;
      mockAuthService.register.mockRejectedValue(
        new Error(
          'VALIDATION_ERROR: Password must be at least 6 characters long'
        )
      );

      // Act & Assert
      await expect(
        authController.register(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await authController.register(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('VALIDATION_ERROR');
        expect((error as AppError).statusCode).toBe(400);
        expect((error as AppError).message).toBe(
          'Password must be at least 6 characters long'
        );
      }
    });

    it('應該重新拋出未知錯誤', async () => {
      // Arrange
      const unknownError = new Error('Unknown error');
      mockContext.request!.body = validRegisterData;
      mockAuthService.register.mockRejectedValue(unknownError);

      // Act & Assert
      await expect(
        authController.register(mockContext as Context)
      ).rejects.toThrow(unknownError);
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockLoginResponse = {
      success: true as const,
      data: {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'jwt-token',
      },
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    it('應該成功登入使用者', async () => {
      // Arrange
      mockContext.request!.body = validLoginData;
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      // Act
      await authController.login(mockContext as Context);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
      expect(mockContext.status).toBe(200);
      expect(mockContext.body).toEqual(mockLoginResponse);
    });

    it('當認證失敗時應該拋出 AUTHENTICATION_ERROR', async () => {
      // Arrange
      mockContext.request!.body = validLoginData;
      mockAuthService.login.mockRejectedValue(
        new Error('AUTHENTICATION_ERROR: Invalid email or password')
      );

      // Act & Assert
      await expect(
        authController.login(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await authController.login(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('AUTHENTICATION_ERROR');
        expect((error as AppError).statusCode).toBe(401);
        expect((error as AppError).message).toBe('Invalid email or password');
      }
    });

    it('應該重新拋出未知錯誤', async () => {
      // Arrange
      const unknownError = new Error('Unknown error');
      mockContext.request!.body = validLoginData;
      mockAuthService.login.mockRejectedValue(unknownError);

      // Act & Assert
      await expect(
        authController.login(mockContext as Context)
      ).rejects.toThrow(unknownError);
    });
  });

  describe('constructor', () => {
    it('應該使用提供的 AuthService', () => {
      // Arrange & Act
      const controller = new AuthController(mockAuthService);

      // Assert
      expect(controller).toBeInstanceOf(AuthController);
    });

    it('應該在沒有提供 AuthService 時建立預設實例', () => {
      // Arrange & Act
      const controller = new AuthController();

      // Assert
      expect(controller).toBeInstanceOf(AuthController);
    });
  });
});
