# API 測試指南

## 概述

本指南提供了 Service Booking API 的完整測試方法，包括手動測試、自動化測試和使用 Postman 進行 API 測試的詳細說明。

## 測試環境準備

### 1. 啟動開發伺服器

```bash
# 安裝依賴
npm install

# 初始化資料庫
npm run migrate
npm run seed

# 啟動開發伺服器
npm run dev
```

伺服器將在 `http://localhost:3000` 啟動。

### 2. 驗證伺服器狀態

```bash
# 檢查健康狀態
curl http://localhost:3000/health
```

預期回應：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "healthy"
  }
}
```

## Postman 測試

### 1. 匯入 Postman Collection

1. 開啟 Postman
2. 點擊 "Import" 按鈕
3. 選擇 `docs/postman-collection.json` 檔案
4. 匯入完成後會看到 "Service Booking API" 集合

### 2. 設定環境變數

建立新的 Postman 環境：

| 變數名稱       | 初始值                  | 說明                    |
| -------------- | ----------------------- | ----------------------- |
| `baseUrl`      | `http://localhost:3000` | API 基礎 URL            |
| `token`        | (空白)                  | JWT Token（自動設定）   |
| `userId`       | (空白)                  | 用戶 ID（自動設定）     |
| `serviceId`    | (空白)                  | 服務 ID（自動設定）     |
| `newServiceId` | (空白)                  | 新建服務 ID（自動設定） |

### 3. 執行測試流程

#### 步驟 1：註冊新用戶
- 執行 "認證 API" → "註冊用戶"
- 系統會自動生成隨機的用戶資料
- Token 會自動儲存到環境變數

#### 步驟 2：查詢服務列表
- 執行 "服務管理 API" → "查詢服務列表（公開）"
- 會自動儲存第一個服務的 ID

#### 步驟 3：查詢單一服務
- 執行 "服務管理 API" → "查詢單一服務（公開）"
- 使用步驟 2 儲存的服務 ID

#### 步驟 4：新增服務
- 執行 "服務管理 API" → "新增服務（需要認證）"
- 會自動儲存新建服務的 ID

#### 步驟 5：更新服務
- 執行 "服務管理 API" → "更新服務（需要認證）"
- 使用步驟 4 儲存的服務 ID

#### 步驟 6：刪除服務
- 執行 "服務管理 API" → "刪除服務（需要認證）"
- 使用步驟 4 儲存的服務 ID

### 4. 批次執行測試

使用 Postman Runner：

1. 點擊集合旁的 "Run" 按鈕
2. 選擇要執行的請求
3. 設定執行順序和次數
4. 點擊 "Run Service Booking API"

## cURL 測試範例

### 認證測試

#### 註冊用戶
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "測試用戶"
  }'
```

#### 登入用戶
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 服務管理測試

#### 查詢服務列表
```bash
curl -X GET "http://localhost:3000/services?page=1&limit=5"
```

#### 查詢單一服務
```bash
curl -X GET http://localhost:3000/services/SERVICE_ID
```

#### 新增服務（需要 Token）
```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "測試服務",
    "description": "這是一個測試服務",
    "price": 50000,
    "showTime": 120,
    "order": 1,
    "isPublic": true
  }'
```

#### 更新服務（需要 Token）
```bash
curl -X PUT http://localhost:3000/services/SERVICE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "更新後的服務名稱",
    "price": 60000
  }'
```

#### 刪除服務（需要 Token）
```bash
curl -X DELETE http://localhost:3000/services/SERVICE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 自動化測試

### 執行單元測試
```bash
npm test
```

### 執行整合測試
```bash
npm test -- --testPathPattern=integration
```

### 產生測試覆蓋率報告
```bash
npm run test:coverage
```

### CI/CD 測試
```bash
npm run test:ci
```

## 錯誤測試案例

### 1. 驗證錯誤測試

#### 無效的 Email 格式
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123!",
    "name": "測試用戶"
  }'
```

預期回應：`400 Bad Request`

#### 密碼太短
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123",
    "name": "測試用戶"
  }'
```

預期回應：`400 Bad Request`

### 2. 認證錯誤測試

#### 無效的 Token
```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{
    "name": "測試服務",
    "price": 50000
  }'
```

預期回應：`401 Unauthorized`

#### 缺少 Token
```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試服務",
    "price": 50000
  }'
```

預期回應：`401 Unauthorized`

### 3. 資源不存在測試

#### 查詢不存在的服務
```bash
curl -X GET http://localhost:3000/services/00000000-0000-0000-0000-000000000000
```

預期回應：`404 Not Found`

### 4. 重複資料測試

#### 使用已存在的 Email 註冊
```bash
# 先註冊一個用戶
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "SecurePass123!",
    "name": "用戶1"
  }'

# 再次使用相同 Email 註冊
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "SecurePass123!",
    "name": "用戶2"
  }'
```

預期第二次回應：`409 Conflict`

## 效能測試

### 使用 Apache Bench (ab)

#### 測試登入端點
```bash
# 準備測試資料檔案 login-data.json
echo '{"email":"test@example.com","password":"SecurePass123!"}' > login-data.json

# 執行效能測試
ab -n 100 -c 10 -p login-data.json -T application/json http://localhost:3000/auth/login
```

#### 測試服務列表端點
```bash
ab -n 1000 -c 50 http://localhost:3000/services
```

### 使用 Artillery

#### 安裝 Artillery
```bash
npm install -g artillery
```

#### 建立測試設定檔 `artillery-test.yml`
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/health"
      - get:
          url: "/services"
      - post:
          url: "/auth/login"
          json:
            email: "test@example.com"
            password: "SecurePass123!"
```

#### 執行效能測試
```bash
artillery run artillery-test.yml
```

## 測試資料管理

### 重置測試資料庫
```bash
npm run db:reset
```

### 載入種子資料
```bash
npm run seed
```

### 驗證種子資料
```bash
npm run seed:verify
```

## 測試最佳實踐

### 1. 測試隔離
- 每個測試案例都應該獨立
- 不依賴其他測試的執行結果
- 使用適當的 setup 和 teardown

### 2. 資料清理
- 測試後清理建立的測試資料
- 使用交易回滾或資料庫重置

### 3. 錯誤處理測試
- 測試所有可能的錯誤情況
- 驗證錯誤回應格式
- 確保適當的 HTTP 狀態碼

### 4. 邊界值測試
- 測試輸入的最小值和最大值
- 測試空值和 null 值
- 測試特殊字元和 Unicode

### 5. 安全性測試
- 測試 SQL 注入防護
- 測試 XSS 防護
- 測試認證和授權機制

## 常見問題排除

### 1. 連接被拒絕
**問題**: `Connection refused`
**解決方案**: 確認伺服器已啟動且監聽正確的埠號

### 2. 資料庫錯誤
**問題**: `Database connection failed`
**解決方案**: 執行 `npm run migrate` 初始化資料庫

### 3. Token 過期
**問題**: `Token expired`
**解決方案**: 重新登入獲取新的 Token

### 4. 權限不足
**問題**: `Insufficient permissions`
**解決方案**: 確認使用正確的 JWT Token

## 測試報告

### 產生測試報告
```bash
# Jest 測試報告
npm run test:coverage

# 查看覆蓋率報告
open coverage/lcov-report/index.html
```

### 測試指標
- **單元測試覆蓋率**: 目標 > 80%
- **整合測試覆蓋率**: 目標 > 70%
- **API 回應時間**: 目標 < 200ms
- **錯誤率**: 目標 < 1%

## 持續整合測試

### GitHub Actions 設定
測試會在以下情況自動執行：
- Push 到 main 或 develop 分支
- 建立 Pull Request
- 每日定時執行

### 測試流程
1. 安裝依賴
2. 執行 ESLint 檢查
3. 執行單元測試
4. 執行整合測試
5. 產生覆蓋率報告
6. 上傳測試結果

---

**最後更新**: 2024-01-01  
**版本**: v1.0.0