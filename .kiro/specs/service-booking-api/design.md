# 設計文件

## 概述

本系統是一個基於 TypeScript + Node.js + Koa + SQLite 的服務預約管理後端 API，提供會員註冊/登入功能和服務項目的完整 CRUD 操作。系統採用分層架構設計，確保代碼的可維護性和可擴展性。

## 架構

### 技術棧
- **語言/框架**: TypeScript + Node.js + Koa
- **ORM**: Sequelize (支援 migration 和 seed)
- **資料庫**: SQLite (開發環境)
- **驗證**: Joi (輸入驗證) + JWT (身份驗證)
- **測試**: Jest
- **代碼品質**: ESLint + Prettier

### 分層架構
```
src/
├── controllers/     # 控制器層 - 處理 HTTP 請求和回應
├── services/        # 服務層 - 業務邏輯處理
├── repositories/    # 資料存取層 - 資料庫操作
├── models/          # 資料模型層 - Sequelize 模型定義
├── middlewares/     # 中介軟體 - 驗證、錯誤處理等
├── utils/           # 工具函數 - 通用功能
├── routes/          # 路由定義
├── config/          # 設定檔案
└── database/        # 資料庫相關 (migrations, seeds)
```

## 元件與介面

### 1. 資料模型 (Models)

#### User 模型
```typescript
interface UserAttributes {
  id: string;           // UUID 主鍵
  email: string;        // 唯一 email
  password: string;     // 雜湊後的密碼
  name: string;         // 使用者姓名
  createdAt: Date;
  updatedAt: Date;
}
```

#### AppointmentService 模型
```typescript
interface AppointmentServiceAttributes {
  id: string;           // UUID 主鍵
  name: string;         // 服務名稱
  description?: string; // 服務描述
  price: number;        // 價格 (整數，以分為單位)
  showTime?: number;    // 顯示時間
  order: number;        // 排序 (預設 0)
  isRemove: boolean;    // 軟刪除標記 (預設 false)
  isPublic: boolean;    // 是否公開 (預設 true)
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. API 端點設計

#### 認證相關
- `POST /auth/register` - 會員註冊
- `POST /auth/login` - 會員登入

#### 服務管理
- `GET /services` - 查詢服務列表 (公開)
- `GET /services/:id` - 查詢單一服務 (公開)
- `POST /services` - 新增服務 (需 JWT)
- `PUT /services/:id` - 更新服務 (需 JWT)
- `DELETE /services/:id` - 刪除服務 (需 JWT)

### 3. 中介軟體設計

#### JWT 驗證中介軟體
```typescript
interface JWTMiddleware {
  verifyToken(ctx: Context, next: Next): Promise<void>;
}
```

#### 輸入驗證中介軟體
```typescript
interface ValidationMiddleware {
  validateBody(schema: Joi.Schema): (ctx: Context, next: Next) => Promise<void>;
  validateParams(schema: Joi.Schema): (ctx: Context, next: Next) => Promise<void>;
}
```

#### 錯誤處理中介軟體
```typescript
interface ErrorHandler {
  handleError(ctx: Context, next: Next): Promise<void>;
}
```

### 4. 服務層介面

#### AuthService
```typescript
interface AuthService {
  register(userData: RegisterDto): Promise<UserResponse>;
  login(credentials: LoginDto): Promise<LoginResponse>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateJWT(userId: string): string;
}
```

#### ServiceManagementService
```typescript
interface ServiceManagementService {
  getPublicServices(): Promise<AppointmentService[]>;
  getServiceById(id: string): Promise<AppointmentService | null>;
  createService(serviceData: CreateServiceDto): Promise<AppointmentService>;
  updateService(id: string, serviceData: UpdateServiceDto): Promise<AppointmentService>;
  deleteService(id: string): Promise<void>;
}
```

## 資料模型

### 資料庫設計

#### Users 表格
```sql
CREATE TABLE IF NOT EXISTS "Users" (
  id UUID NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS users_email ON "Users" (email);
```

#### AppointmentServices 表格
```sql
CREATE TABLE IF NOT EXISTS "AppointmentServices" (
  id UUID NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  "showTime" INTEGER,
  "order" INTEGER DEFAULT 0,
  "isRemove" BOOLEAN DEFAULT false,
  "isPublic" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS appointment_services_order ON "AppointmentServices" ("order");
CREATE INDEX IF NOT EXISTS appointment_services_public ON "AppointmentServices" ("isPublic", "isRemove");
```

### 資料驗證規則

#### 註冊驗證
```typescript
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required()
});
```

#### 登入驗證
```typescript
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
```

#### 服務建立/更新驗證
```typescript
const serviceSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  price: Joi.number().integer().min(0).required(),
  showTime: Joi.number().integer().min(0).optional(),
  order: Joi.number().integer().min(0).optional(),
  isPublic: Joi.boolean().optional()
});
```

## 錯誤處理

### 錯誤回應格式
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### 常見錯誤類型
- `VALIDATION_ERROR` - 輸入驗證失敗
- `AUTHENTICATION_ERROR` - 身份驗證失敗
- `AUTHORIZATION_ERROR` - 權限不足
- `NOT_FOUND_ERROR` - 資源不存在
- `DUPLICATE_ERROR` - 資料重複 (如 email 已存在)
- `INTERNAL_ERROR` - 伺服器內部錯誤

### HTTP 狀態碼對應
- 200: 成功
- 201: 建立成功
- 400: 請求錯誤 (驗證失敗)
- 401: 未授權 (需要登入)
- 403: 禁止存取 (權限不足)
- 404: 資源不存在
- 409: 衝突 (資料重複)
- 500: 伺服器內部錯誤

## 測試策略

### 測試層級
1. **單元測試**: 測試個別函數和方法
2. **整合測試**: 測試 API 端點和資料庫互動
3. **端到端測試**: 測試完整的使用者流程

### 測試覆蓋範圍
- 所有 API 端點
- 資料驗證邏輯
- 身份驗證和授權
- 錯誤處理
- 資料庫操作

### 測試資料管理
- 使用 Sequelize seed 建立測試資料
- 每個測試前重置資料庫狀態
- 使用 SQLite 記憶體資料庫進行測試

## 安全性考量

### 密碼安全
- 使用 bcrypt 進行密碼雜湊
- 設定適當的 salt rounds (建議 12)

### JWT 安全
- 設定適當的過期時間 (建議 24 小時)
- 使用強隨機密鑰
- 在 HTTP-only cookie 中儲存 token (可選)

### 輸入驗證
- 所有輸入都必須通過 Joi 驗證
- 防止 SQL 注入 (Sequelize ORM 提供保護)
- 限制請求大小和頻率

### CORS 設定
- 設定適當的 CORS 政策
- 限制允許的來源域名

## 效能考量

### 資料庫最佳化
- 在常用查詢欄位建立索引
- 使用軟刪除避免實際刪除資料
- 實作分頁查詢

### 快取策略
- 對公開服務列表實作快取
- 使用 Redis 進行 session 管理 (未來擴展)

### 監控和日誌
- 記錄所有 API 請求和錯誤
- 監控回應時間和錯誤率
- 實作健康檢查端點