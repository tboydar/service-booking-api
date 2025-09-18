---
inclusion: fileMatch
fileMatchPattern: '*test*|*spec*'
---

# 測試開發指導原則

## 測試架構與組織

### 測試目錄結構
```
tests/
├── unit/                 # 單元測試
│   ├── services/
│   ├── repositories/
│   ├── utils/
│   └── middlewares/
├── integration/          # 整合測試
│   ├── auth/
│   └── services/
├── fixtures/             # 測試資料
│   ├── users.json
│   └── services.json
└── helpers/              # 測試輔助工具
    ├── database.ts
    ├── factories.ts
    └── mocks.ts
```

### Jest 設定
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/database/migrations/**',
    '!src/database/seeds/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

## 單元測試標準

### Service 層測試
```typescript
import { UserService } from '../../src/services/UserService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { PasswordUtil } from '../../src/utils/PasswordUtil';
import { JWTUtil } from '../../src/utils/JWTUtil';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordUtil: jest.Mocked<PasswordUtil>;
  let mockJWTUtil: jest.Mocked<JWTUtil>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn()
    } as any;

    mockPasswordUtil = {
      hash: jest.fn(),
      verify: jest.fn()
    } as any;

    mockJWTUtil = {
      generate: jest.fn()
    } as any;

    userService = new UserService(
      mockUserRepository,
      mockPasswordUtil,
      mockJWTUtil
    );
  });

  describe('register', () => {
    it('應該成功註冊新使用者', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: '測試使用者'
      };
      const hashedPassword = 'hashed_password';
      const createdUser = {
        id: 'user-id',
        email: userData.email,
        name: userData.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordUtil.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(createdUser as any);

      // Act
      const result = await userService.register(userData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockPasswordUtil.hash).toHaveBeenCalledWith(userData.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword
      });
      expect(result).toEqual(createdUser);
    });

    it('當 email 已存在時應該拋出錯誤', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: '測試使用者'
      };
      const existingUser = { id: 'existing-id', email: userData.email };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);

      // Act & Assert
      await expect(userService.register(userData)).rejects.toThrow('Email 已存在');
      expect(mockPasswordUtil.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('應該成功登入並回傳 token', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      const user = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashed_password',
        name: '測試使用者'
      };
      const token = 'jwt-token';

      mockUserRepository.findByEmail.mockResolvedValue(user as any);
      mockPasswordUtil.verify.mockResolvedValue(true);
      mockJWTUtil.generate.mockReturnValue(token);

      // Act
      const result = await userService.login(credentials);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(mockPasswordUtil.verify).toHaveBeenCalledWith(credentials.password, user.password);
      expect(mockJWTUtil.generate).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      });
    });

    it('當使用者不存在時應該拋出錯誤', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.login(credentials)).rejects.toThrow('帳號或密碼錯誤');
      expect(mockPasswordUtil.verify).not.toHaveBeenCalled();
    });

    it('當密碼錯誤時應該拋出錯誤', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrong_password'
      };
      const user = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashed_password'
      };

      mockUserRepository.findByEmail.mockResolvedValue(user as any);
      mockPasswordUtil.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(userService.login(credentials)).rejects.toThrow('帳號或密碼錯誤');
      expect(mockJWTUtil.generate).not.toHaveBeenCalled();
    });
  });
});
```

### Repository 層測試
```typescript
import { SequelizeUserRepository } from '../../src/repositories/SequelizeUserRepository';
import { User } from '../../src/models/User';

// Mock Sequelize 模型
jest.mock('../../src/models/User');

describe('SequelizeUserRepository', () => {
  let userRepository: SequelizeUserRepository;
  let mockUser: jest.Mocked<typeof User>;

  beforeEach(() => {
    mockUser = User as jest.Mocked<typeof User>;
    userRepository = new SequelizeUserRepository();
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('應該根據 email 找到使用者', async () => {
      // Arrange
      const email = 'test@example.com';
      const expectedUser = {
        id: 'user-id',
        email,
        name: '測試使用者'
      };

      mockUser.findOne.mockResolvedValue(expectedUser as any);

      // Act
      const result = await userRepository.findByEmail(email);

      // Assert
      expect(mockUser.findOne).toHaveBeenCalledWith({
        where: { email }
      });
      expect(result).toEqual(expectedUser);
    });

    it('當使用者不存在時應該回傳 null', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockUser.findOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.findByEmail(email);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('應該建立新使用者並排除密碼欄位', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashed_password',
        name: '測試使用者'
      };
      const createdUser = {
        id: 'user-id',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: jest.fn().mockReturnValue({
          id: 'user-id',
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };

      mockUser.create.mockResolvedValue(createdUser as any);

      // Act
      const result = await userRepository.create(userData);

      // Assert
      expect(mockUser.create).toHaveBeenCalledWith(userData);
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
    });
  });
});
```

## 整合測試標準

### API 端點測試
```typescript
import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { createTestUser, createTestService } from '../helpers/factories';

describe('Auth API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理測試資料
    await sequelize.truncate({ cascade: true });
  });

  describe('POST /auth/register', () => {
    it('應該成功註冊新使用者', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: '測試使用者'
      };

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('當 email 格式錯誤時應該回傳驗證錯誤', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: '測試使用者'
      };

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveProperty('email');
    });

    it('當 email 已存在時應該回傳衝突錯誤', async () => {
      // Arrange
      const existingUser = await createTestUser({
        email: 'existing@example.com'
      });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: '測試使用者'
      };

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_ERROR');
    });
  });

  describe('POST /auth/login', () => {
    it('應該成功登入並回傳 token', async () => {
      // Arrange
      const password = 'password123';
      const user = await createTestUser({ password });

      const credentials = {
        email: user.email,
        password
      };

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('當密碼錯誤時應該回傳認證錯誤', async () => {
      // Arrange
      const user = await createTestUser();
      const credentials = {
        email: user.email,
        password: 'wrong_password'
      };

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send(credentials)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });
});
```

### 需要認證的 API 測試
```typescript
describe('Services API', () => {
  let authToken: string;
  let testUser: any;

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
    
    // 建立測試使用者並取得 token
    testUser = await createTestUser();
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'password123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  describe('POST /services', () => {
    it('應該成功建立服務', async () => {
      // Arrange
      const serviceData = {
        name: '測試服務',
        description: '這是一個測試服務',
        price: 1000,
        showTime: 60,
        order: 1,
        isPublic: true
      };

      // Act
      const response = await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(serviceData.name);
      expect(response.body.data.price).toBe(serviceData.price);
    });

    it('當未提供 token 時應該回傳認證錯誤', async () => {
      // Arrange
      const serviceData = {
        name: '測試服務',
        price: 1000
      };

      // Act
      const response = await request(app)
        .post('/services')
        .send(serviceData)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });
});
```

## 測試輔助工具

### 測試資料工廠
```typescript
// tests/helpers/factories.ts
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../src/models/User';
import { AppointmentService } from '../../src/models/AppointmentService';

export async function createTestUser(overrides: any = {}): Promise<User> {
  const defaultData = {
    id: uuidv4(),
    email: `test-${Date.now()}@example.com`,
    password: await bcrypt.hash('password123', 12),
    name: '測試使用者',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return await User.create({ ...defaultData, ...overrides });
}

export async function createTestService(overrides: any = {}): Promise<AppointmentService> {
  const defaultData = {
    id: uuidv4(),
    name: `測試服務-${Date.now()}`,
    description: '這是一個測試服務',
    price: 1000,
    showTime: 60,
    order: 1,
    isRemove: false,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return await AppointmentService.create({ ...defaultData, ...overrides });
}
```

### 測試資料庫設定
```typescript
// tests/helpers/database.ts
import { sequelize } from '../../src/config/database';

export async function setupTestDatabase(): Promise<void> {
  await sequelize.sync({ force: true });
}

export async function cleanupTestDatabase(): Promise<void> {
  await sequelize.truncate({ cascade: true });
}

export async function closeTestDatabase(): Promise<void> {
  await sequelize.close();
}
```

### Mock 工具
```typescript
// tests/helpers/mocks.ts
import { Context } from 'koa';

export function createMockContext(overrides: any = {}): Partial<Context> {
  return {
    request: {
      body: {},
      ...overrides.request
    },
    params: {},
    query: {},
    state: {},
    status: 200,
    body: null,
    ...overrides
  };
}

export function createMockNext(): jest.Mock {
  return jest.fn().mockResolvedValue(undefined);
}
```

## 測試執行腳本

### package.json 測試腳本
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### 測試設定檔
```typescript
// tests/setup.ts
import { setupTestDatabase, closeTestDatabase } from './helpers/database';

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

// 設定測試超時時間
jest.setTimeout(10000);
```