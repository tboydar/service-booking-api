/**
 * User related type definitions
 */

/**
 * User attributes interface
 */
export interface UserAttributes {
  id: string; // UUID 主鍵
  email: string; // 唯一 email
  password: string; // 雜湊後的密碼
  name: string; // 使用者姓名
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User creation attributes (without auto-generated fields)
 */
export interface UserCreationAttributes {
  id?: string; // Optional, will be auto-generated if not provided
  email: string;
  password: string;
  name: string;
}

/**
 * User response attributes (without sensitive data)
 */
export interface UserResponseAttributes {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User registration DTO
 */
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

/**
 * User login DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Login response DTO
 */
export interface LoginResponse {
  success: true;
  data: {
    user: UserResponseAttributes;
    token: string;
  };
  timestamp: string;
}

/**
 * User response DTO
 */
export interface UserResponse {
  success: true;
  data: UserResponseAttributes;
  timestamp: string;
}
