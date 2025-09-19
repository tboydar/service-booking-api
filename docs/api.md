# API 文檔

## 概述

Service Booking API 是一個基於 RESTful 架構的服務預約管理系統後端 API。本文檔詳細說明了所有可用的 API 端點、請求格式、回應格式以及錯誤處理機制。

## 基本資訊

- **Base URL**: `http://localhost:3000`
- **API Version**: v1
- **Content-Type**: `application/json`
- **認證方式**: JWT Bearer Token

## 認證機制

### JWT Token 使用方式

所有需要認證的 API 端點都需要在 HTTP Header 中包含 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### Token 生命週期

- **有效期**: 24 小時
- **刷新機制**: 需要重新登入獲取新 Token
- **儲存建議**: 安全地儲存在客戶端（如 localStorage 或 httpOnly cookie）

## API 端點

### 認證相關 API

#### 1. 會員註冊

**端點**: `POST /auth/register`

**描述**: 註冊新的會員帳號

**請求格式**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "張小明"
}
```

**請求驗證規則**:
- `email`: 必填，有效的電子郵件格式
- `password`: 必填，最少 6 個字元
- `name`: 必填，2-50 個字元

**成功回應** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "張小明",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**錯誤回應**:
- `400 Bad Request`: 輸入驗證失敗
- `409 Conflict`: Email 已存在

#### 2. 會員登入

**端點**: `POST /auth/login`

**描述**: 會員登入系統

**請求格式**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**請求驗證規則**:
- `email`: 必填，有效的電子郵件格式
- `password`: 必填

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "張小明",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**錯誤回應**:
- `400 Bad Request`: 輸入驗證失敗
- `401 Unauthorized`: 帳號或密碼錯誤

### 服務管理 API

#### 3. 查詢服務列表（公開）

**端點**: `GET /services`

**描述**: 查詢所有公開且未刪除的服務項目

**查詢參數**:
- `page` (可選): 頁碼，預設為 1
- `limit` (可選): 每頁筆數，預設為 10，最大 100
- `sort` (可選): 排序方式，可選值：`order`, `name`, `price`, `createdAt`
- `order` (可選): 排序順序，可選值：`asc`, `desc`，預設為 `asc`

**請求範例**:
```http
GET /services?page=1&limit=10&sort=order&order=asc
```

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "網站開發服務",
      "description": "提供專業的網站開發服務，包含前端和後端開發",
      "price": 50000,
      "showTime": 120,
      "order": 1,
      "isPublic": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 4. 查詢單一服務（公開）

**端點**: `GET /services/:id`

**描述**: 查詢指定 ID 的服務詳細資訊

**路徑參數**:
- `id`: 服務 ID (UUID 格式)

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "網站開發服務",
    "description": "提供專業的網站開發服務，包含前端和後端開發",
    "price": 50000,
    "showTime": 120,
    "order": 1,
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**錯誤回應**:
- `404 Not Found`: 服務不存在或已被刪除

#### 5. 新增服務（需要認證）

**端點**: `POST /services`

**描述**: 新增一個服務項目

**認證**: 需要 JWT Token

**請求格式**:
```json
{
  "name": "網站開發服務",
  "description": "提供專業的網站開發服務，包含前端和後端開發",
  "price": 50000,
  "showTime": 120,
  "order": 1,
  "isPublic": true
}
```

**請求驗證規則**:
- `name`: 必填，1-255 個字元
- `description`: 可選，最多 1000 個字元
- `price`: 必填，非負整數（以分為單位）
- `showTime`: 可選，非負整數（分鐘）
- `order`: 可選，非負整數，預設為 0
- `isPublic`: 可選，布林值，預設為 true

**成功回應** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "網站開發服務",
    "description": "提供專業的網站開發服務，包含前端和後端開發",
    "price": 50000,
    "showTime": 120,
    "order": 1,
    "isRemove": false,
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**錯誤回應**:
- `400 Bad Request`: 輸入驗證失敗
- `401 Unauthorized`: 未提供有效的 JWT Token

#### 6. 更新服務（需要認證）

**端點**: `PUT /services/:id`

**描述**: 更新指定 ID 的服務資訊

**認證**: 需要 JWT Token

**路徑參數**:
- `id`: 服務 ID (UUID 格式)

**請求格式**:
```json
{
  "name": "更新後的網站開發服務",
  "description": "更新後的服務描述",
  "price": 60000,
  "showTime": 150,
  "order": 2,
  "isPublic": false
}
```

**請求驗證規則**: 與新增服務相同，但所有欄位都是可選的

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "更新後的網站開發服務",
    "description": "更新後的服務描述",
    "price": 60000,
    "showTime": 150,
    "order": 2,
    "isRemove": false,
    "isPublic": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z"
  },
  "timestamp": "2024-01-01T01:00:00.000Z"
}
```

**錯誤回應**:
- `400 Bad Request`: 輸入驗證失敗
- `401 Unauthorized`: 未提供有效的 JWT Token
- `404 Not Found`: 服務不存在

#### 7. 刪除服務（需要認證）

**端點**: `DELETE /services/:id`

**描述**: 軟刪除指定 ID 的服務（設定 isRemove 為 true）

**認證**: 需要 JWT Token

**路徑參數**:
- `id`: 服務 ID (UUID 格式)

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "服務已成功刪除"
  },
  "timestamp": "2024-01-01T01:00:00.000Z"
}
```

**錯誤回應**:
- `401 Unauthorized`: 未提供有效的 JWT Token
- `404 Not Found`: 服務不存在

### 系統狀態 API

#### 8. 健康檢查

**端點**: `GET /health`

**描述**: 檢查系統健康狀態

**成功回應** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "healthy"
  },
  "memory": {
    "used": 45.2,
    "total": 512,
    "unit": "MB"
  }
}
```

## 錯誤處理

### 錯誤回應格式

所有錯誤回應都遵循統一的格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤描述",
    "details": "詳細錯誤資訊或驗證錯誤列表"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### 錯誤代碼說明

| HTTP 狀態碼 | 錯誤代碼               | 說明                        |
| ----------- | ---------------------- | --------------------------- |
| 400         | `VALIDATION_ERROR`     | 輸入資料驗證失敗            |
| 401         | `AUTHENTICATION_ERROR` | 身份驗證失敗                |
| 403         | `AUTHORIZATION_ERROR`  | 權限不足                    |
| 404         | `NOT_FOUND_ERROR`      | 資源不存在                  |
| 409         | `DUPLICATE_ERROR`      | 資料重複（如 Email 已存在） |
| 500         | `INTERNAL_ERROR`       | 伺服器內部錯誤              |

### 驗證錯誤範例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料驗證失敗",
    "details": [
      {
        "field": "email",
        "message": "請輸入有效的電子郵件格式"
      },
      {
        "field": "password",
        "message": "密碼至少需要 6 個字元"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/auth/register"
}
```

## 速率限制

為了保護 API 免受濫用，系統實施了速率限制：

- **一般端點**: 每分鐘最多 100 次請求
- **認證端點**: 每分鐘最多 10 次請求
- **超出限制**: 回傳 `429 Too Many Requests`

## 分頁機制

對於返回列表的 API 端點，系統支援分頁查詢：

### 分頁參數

- `page`: 頁碼，從 1 開始
- `limit`: 每頁筆數，預設 10，最大 100

### 分頁回應格式

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 排序機制

支援排序的端點可以使用以下參數：

- `sort`: 排序欄位
- `order`: 排序順序（`asc` 或 `desc`）

### 可排序欄位

**服務列表**:
- `order`: 自訂排序
- `name`: 服務名稱
- `price`: 價格
- `createdAt`: 建立時間

## 使用範例

### cURL 範例

#### 註冊新用戶
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "張小明"
  }'
```

#### 登入
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### 查詢服務列表
```bash
curl -X GET "http://localhost:3000/services?page=1&limit=10"
```

#### 新增服務（需要 Token）
```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "新服務",
    "description": "服務描述",
    "price": 30000,
    "showTime": 90,
    "order": 1,
    "isPublic": true
  }'
```

### JavaScript 範例

#### 使用 fetch API

```javascript
// 註冊用戶
async function registerUser(userData) {
  const response = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 儲存 token
    localStorage.setItem('token', result.data.token);
    return result.data.user;
  } else {
    throw new Error(result.error.message);
  }
}

// 查詢服務列表
async function getServices(page = 1, limit = 10) {
  const response = await fetch(`http://localhost:3000/services?page=${page}&limit=${limit}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error.message);
  }
}

// 新增服務（需要認證）
async function createService(serviceData) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(serviceData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error.message);
  }
}
```

## 版本控制

API 版本控制策略：

- **當前版本**: v1
- **版本格式**: 在 URL 中包含版本號（未來實作）
- **向後相容**: 保證同一主版本內的向後相容性
- **棄用政策**: 舊版本將在新版本發布後至少維護 6 個月

## 安全性考量

### 資料傳輸安全
- 生產環境必須使用 HTTPS
- 敏感資料（如密碼）永不在回應中返回
- JWT Token 應安全儲存

### 輸入驗證
- 所有輸入都經過嚴格驗證
- 防止 SQL 注入攻擊
- 防止 XSS 攻擊

### 認證與授權
- JWT Token 具有適當的過期時間
- 敏感操作需要有效的認證
- 實施適當的速率限制

## 支援與聯絡

如有任何問題或建議，請透過以下方式聯絡：

- **GitHub Issues**: [專案 Issues 頁面]
- **Email**: [聯絡信箱]
- **文檔更新**: 本文檔會隨著 API 更新而持續維護

---

**最後更新**: 2024-01-01  
**API 版本**: v1.0.0