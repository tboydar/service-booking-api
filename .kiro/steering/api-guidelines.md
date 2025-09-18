---
inclusion: fileMatch
fileMatchPattern: '*controller*'
---

# API 開發指導原則

## Controller 層實作標準

### 基本結構
每個 Controller 都應該遵循以下結構：

```typescript
import { Context, Next } from 'koa';
import { inject, injectable } from 'inversify';
import { ServiceInterface } from '../services';
import { validateBody, validateParams } from '../middlewares/validation';

@injectable()
export class ExampleController {
  constructor(
    @inject('ExampleService') private exampleService: ServiceInterface
  ) {}

  public async create(ctx: Context, next: Next): Promise<void> {
    try {
      const data = await this.exampleService.create(ctx.request.body);
      ctx.status = 201;
      ctx.body = {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error; // 讓錯誤中介軟體處理
    }
  }
}
```

### HTTP 狀態碼使用
- `200 OK` - 成功取得資源
- `201 Created` - 成功建立資源
- `204 No Content` - 成功刪除資源
- `400 Bad Request` - 請求格式錯誤或驗證失敗
- `401 Unauthorized` - 未提供有效的身份驗證
- `403 Forbidden` - 權限不足
- `404 Not Found` - 資源不存在
- `409 Conflict` - 資源衝突 (如 email 重複)
- `500 Internal Server Error` - 伺服器內部錯誤

### 請求驗證
所有 API 端點都必須進行輸入驗證：

```typescript
// 在路由中使用驗證中介軟體
router.post('/users', 
  validateBody(userCreateSchema),
  userController.create
);

// 在 Controller 中存取已驗證的資料
public async create(ctx: Context): Promise<void> {
  const userData = ctx.request.body; // 已通過驗證
  // ... 處理邏輯
}
```

### 錯誤處理
Controller 不應該直接處理錯誤，而是拋出錯誤讓中介軟體處理：

```typescript
public async getById(ctx: Context): Promise<void> {
  const { id } = ctx.params;
  
  const user = await this.userService.findById(id);
  if (!user) {
    const error = new Error('使用者不存在');
    error.name = 'NOT_FOUND_ERROR';
    throw error;
  }
  
  ctx.body = {
    success: true,
    data: user,
    timestamp: new Date().toISOString()
  };
}
```

## 路由設計標準

### 資源路由結構
```typescript
// 會員認證
POST   /auth/register     - 註冊
POST   /auth/login        - 登入
POST   /auth/logout       - 登出 (可選)

// 服務管理
GET    /services          - 取得服務列表 (公開)
GET    /services/:id      - 取得單一服務 (公開)
POST   /services          - 建立服務 (需權限)
PUT    /services/:id      - 更新服務 (需權限)
DELETE /services/:id      - 刪除服務 (需權限)
```

### 路由中介軟體順序
```typescript
router.post('/services',
  validateBody(serviceCreateSchema),  // 1. 輸入驗證
  jwtAuth,                           // 2. 身份驗證
  serviceController.create           // 3. 控制器方法
);
```

## 請求/回應格式

### 請求格式
```typescript
// 註冊請求
{
  "email": "user@example.com",
  "password": "password123",
  "name": "使用者姓名"
}

// 登入請求
{
  "email": "user@example.com",
  "password": "password123"
}

// 建立服務請求
{
  "name": "服務名稱",
  "description": "服務描述",
  "price": 1000,
  "showTime": 60,
  "order": 1,
  "isPublic": true
}
```

### 成功回應格式
```typescript
// 單一資源回應
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "服務名稱",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}

// 列表回應
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "服務名稱"
    }
  ],
  "timestamp": "2023-01-01T00:00:00.000Z"
}

// 登入成功回應
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "使用者姓名"
    },
    "token": "jwt-token"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### 錯誤回應格式
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料驗證失敗",
    "details": {
      "email": "email 格式不正確",
      "password": "密碼至少需要 6 個字元"
    }
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## 中介軟體使用指南

### JWT 驗證中介軟體
```typescript
import { jwtAuth } from '../middlewares/auth';

// 需要驗證的路由
router.post('/services', jwtAuth, serviceController.create);
router.put('/services/:id', jwtAuth, serviceController.update);
router.delete('/services/:id', jwtAuth, serviceController.delete);

// 公開路由不需要驗證
router.get('/services', serviceController.getAll);
router.get('/services/:id', serviceController.getById);
```

### 輸入驗證中介軟體
```typescript
import { validateBody, validateParams } from '../middlewares/validation';
import { userCreateSchema, serviceCreateSchema } from '../schemas';

// 驗證請求主體
router.post('/users', validateBody(userCreateSchema), userController.create);

// 驗證路由參數
router.get('/users/:id', validateParams(idParamSchema), userController.getById);
```

## 效能最佳化

### 資料庫查詢最佳化
```typescript
// 使用索引欄位進行查詢
const services = await Service.findAll({
  where: { 
    isPublic: true, 
    isRemove: false 
  },
  order: [['order', 'ASC']]
});

// 避免 N+1 查詢問題
const users = await User.findAll({
  include: [{ model: Profile }]
});
```

### 回應資料過濾
```typescript
// 不回傳敏感資訊
public async getProfile(ctx: Context): Promise<void> {
  const user = await this.userService.findById(ctx.state.userId);
  
  ctx.body = {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
      // 不包含 password
    },
    timestamp: new Date().toISOString()
  };
}
```

## 測試指南

### Controller 測試範例
```typescript
describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockUserService = {
      create: jest.fn(),
      findById: jest.fn()
    } as any;
    
    userController = new UserController(mockUserService);
  });

  describe('create', () => {
    it('應該成功建立使用者', async () => {
      const userData = { email: 'test@example.com', name: '測試使用者' };
      const createdUser = { id: 'uuid', ...userData };
      
      mockUserService.create.mockResolvedValue(createdUser);
      
      const ctx = createMockContext({ body: userData });
      
      await userController.create(ctx, jest.fn());
      
      expect(ctx.status).toBe(201);
      expect(ctx.body.success).toBe(true);
      expect(ctx.body.data).toEqual(createdUser);
    });
  });
});
```