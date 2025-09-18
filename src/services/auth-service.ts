import { UserRepository } from '../repositories/user-repository';
import { PasswordUtils } from '../utils/password';
import { JWTUtils } from '../utils/jwt';
import type {
  RegisterDto,
  LoginDto,
  LoginResponse,
  UserResponse,
  UserResponseAttributes,
} from '../types/user.types';

/**
 * Authentication service for handling user registration and login
 */
export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Promise<UserResponse> - User response without password
   */
  async register(userData: RegisterDto): Promise<UserResponse> {
    const { email, password, name } = userData;

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(
      email.trim().toLowerCase()
    );
    if (existingUser) {
      throw new Error('DUPLICATE_ERROR: Email already exists');
    }

    // Validate password
    if (!PasswordUtils.isValidPassword(password)) {
      throw new Error(
        'VALIDATION_ERROR: Password must be at least 6 characters long'
      );
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    // Create user
    const newUser = await this.userRepository.create({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
    });

    // Generate JWT token for the new user
    const token = JWTUtils.generateToken(newUser.id, newUser.email);

    // Return user response without password but with token
    const userResponse: UserResponseAttributes = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return {
      success: true,
      data: {
        user: userResponse,
        token,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Login user with email and password
   * @param credentials - User login credentials
   * @returns Promise<LoginResponse> - Login response with user data and JWT token
   */
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await this.userRepository.findByEmail(
      email.trim().toLowerCase()
    );
    if (!user) {
      throw new Error('AUTHENTICATION_ERROR: Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.verifyPassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error('AUTHENTICATION_ERROR: Invalid email or password');
    }

    // Generate JWT token
    const token = JWTUtils.generateToken(user.id, user.email);

    // Return login response
    const userResponse: UserResponseAttributes = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      success: true,
      data: {
        user: userResponse,
        token,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Promise<string> - Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await PasswordUtils.hashPassword(password);
  }

  /**
   * Verify a password against a hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns Promise<boolean> - True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await PasswordUtils.verifyPassword(password, hash);
  }

  /**
   * Generate JWT token for a user
   * @param userId - User ID
   * @param email - User email
   * @returns string - JWT token
   */
  generateJWT(userId: string, email: string): string {
    return JWTUtils.generateToken(userId, email);
  }
}

export default AuthService;
