import { AuthService } from '../auth-service';
import { UserRepository } from '../../repositories/user-repository';
import { PasswordUtils } from '../../utils/password';
import { JWTUtils } from '../../utils/jwt';
import type { RegisterDto, LoginDto } from '../../types/user.types';

// Mock dependencies
jest.mock('../../repositories/user-repository');
jest.mock('../../utils/password', () => ({
  PasswordUtils: {
    isValidPassword: jest.fn(),
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
  },
}));
jest.mock('../../utils/jwt', () => ({
  JWTUtils: {
    generateToken: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

const MockedPasswordUtils = PasswordUtils as jest.Mocked<typeof PasswordUtils>;
const MockedJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      emailExists: jest.fn(),
      count: jest.fn(),
    } as any;

    authService = new AuthService(mockUserRepository);
  });

  describe('register', () => {
    const validRegisterData: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    it('應該成功註冊新使用者', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      MockedPasswordUtils.isValidPassword.mockReturnValue(true);
      MockedPasswordUtils.hashPassword.mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(mockUser as any);

      // Act
      const result = await authService.register(validRegisterData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(MockedPasswordUtils.isValidPassword).toHaveBeenCalledWith(
        'password123'
      );
      expect(MockedPasswordUtils.hashPassword).toHaveBeenCalledWith(
        'password123'
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      });

      expect(result).toEqual({
        success: true,
        data: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        timestamp: expect.any(String),
      });
    });

    it('應該在 email 已存在時拋出錯誤', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(authService.register(validRegisterData)).rejects.toThrow(
        'DUPLICATE_ERROR: Email already exists'
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(MockedPasswordUtils.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('應該在密碼無效時拋出錯誤', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      MockedPasswordUtils.isValidPassword.mockReturnValue(false);

      // Act & Assert
      await expect(authService.register(validRegisterData)).rejects.toThrow(
        'VALIDATION_ERROR: Password must be at least 6 characters long'
      );

      expect(MockedPasswordUtils.isValidPassword).toHaveBeenCalledWith(
        'password123'
      );
      expect(MockedPasswordUtils.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('應該正確處理 email 和 name 的空白字元', async () => {
      // Arrange
      const dataWithSpaces: RegisterDto = {
        email: '  test@example.com  ',
        password: 'password123',
        name: '  Test User  ',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      MockedPasswordUtils.isValidPassword.mockReturnValue(true);
      MockedPasswordUtils.hashPassword.mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(mockUser as any);

      // Act
      await authService.register(dataWithSpaces);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      });
    });
  });

  describe('login', () => {
    const validLoginData: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    it('應該成功登入使用者', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      MockedPasswordUtils.verifyPassword.mockResolvedValue(true);
      MockedJWTUtils.generateToken.mockReturnValue('jwt-token');

      // Act
      const result = await authService.login(validLoginData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(MockedPasswordUtils.verifyPassword).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
      expect(MockedJWTUtils.generateToken).toHaveBeenCalledWith(
        'user-123',
        'test@example.com'
      );

      expect(result).toEqual({
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt,
          },
          token: 'jwt-token',
        },
        timestamp: expect.any(String),
      });
    });

    it('應該在使用者不存在時拋出錯誤', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(validLoginData)).rejects.toThrow(
        'AUTHENTICATION_ERROR: Invalid email or password'
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(MockedPasswordUtils.verifyPassword).not.toHaveBeenCalled();
      expect(MockedJWTUtils.generateToken).not.toHaveBeenCalled();
    });

    it('應該在密碼錯誤時拋出錯誤', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      MockedPasswordUtils.verifyPassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(validLoginData)).rejects.toThrow(
        'AUTHENTICATION_ERROR: Invalid email or password'
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(MockedPasswordUtils.verifyPassword).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
      expect(MockedJWTUtils.generateToken).not.toHaveBeenCalled();
    });

    it('應該正確處理 email 的空白字元和大小寫', async () => {
      // Arrange
      const dataWithSpaces: LoginDto = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      MockedPasswordUtils.verifyPassword.mockResolvedValue(true);
      MockedJWTUtils.generateToken.mockReturnValue('jwt-token');

      // Act
      await authService.login(dataWithSpaces);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });
  });

  describe('hashPassword', () => {
    it('應該呼叫 PasswordUtils.hashPassword', async () => {
      // Arrange
      MockedPasswordUtils.hashPassword.mockResolvedValue('hashed-password');

      // Act
      const result = await authService.hashPassword('password123');

      // Assert
      expect(MockedPasswordUtils.hashPassword).toHaveBeenCalledWith(
        'password123'
      );
      expect(result).toBe('hashed-password');
    });
  });

  describe('verifyPassword', () => {
    it('應該呼叫 PasswordUtils.verifyPassword', async () => {
      // Arrange
      MockedPasswordUtils.verifyPassword.mockResolvedValue(true);

      // Act
      const result = await authService.verifyPassword(
        'password123',
        'hashed-password'
      );

      // Assert
      expect(MockedPasswordUtils.verifyPassword).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
      expect(result).toBe(true);
    });
  });

  describe('generateJWT', () => {
    it('應該呼叫 JWTUtils.generateToken', () => {
      // Arrange
      MockedJWTUtils.generateToken.mockReturnValue('jwt-token');

      // Act
      const result = authService.generateJWT('user-123', 'test@example.com');

      // Assert
      expect(MockedJWTUtils.generateToken).toHaveBeenCalledWith(
        'user-123',
        'test@example.com'
      );
      expect(result).toBe('jwt-token');
    });
  });
});
