---
inclusion: always
---

# 專案開發標準

## 程式碼風格與品質

### TypeScript 編碼標準
- 使用嚴格的 TypeScript 設定 (`strict: true`)
- 所有函數和方法都必須有明確的型別註解
- 使用 `interface` 定義資料結構，使用 `type` 定義聯合型別
- 避免使用 `any` 型別，優先使用 `unknown` 或具體型別
- 使用 PascalCase 命名 class 和 interface，使用 camelCase 命名變數和函數

### 檔案命名規範
- 使用 kebab-case 命名檔案 (例如: `user-service.ts`)
- 測試檔案使用 `.test.ts` 或 `.spec.ts` 後綴
- 型別定義檔案使用 `.types.ts` 後綴
- 常數檔案使用 `.constants.ts` 後綴

### 程式碼組織
- 每個檔案最多 200 行程式碼
- 每個函數最多 50 行程式碼
- 使用 barrel exports (`index.ts`) 統一匯出模組
- 按功能分組相關的檔案到同一目錄

## 錯誤處理標準

### 統一錯誤格式
```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### 錯誤代碼規範
- `VALIDATION_ERROR` - 輸入驗證失敗
- `AUTHENTICATION_ERROR` - 身份驗證失敗
- `AUTHORIZATION_ERROR` - 權限不足
- `NOT_FOUND_ERROR` - 資源不存在
- `DUPLICATE_ERROR` - 資料重複
- `INTERNAL_ERROR` - 伺服器內部錯誤

### 日誌記錄
- 使用結構化日誌格式 (JSON)
- 記錄所有 API 請求和回應
- 記錄所有錯誤和異常
- 不記錄敏感資訊 (密碼、token 等)

## 安全性要求

### 密碼處理
- 使用 bcrypt 進行密碼雜湊，salt rounds 設為 12
- 密碼最少 6 個字元
- 永遠不在日誌或回應中暴露原始密碼

### JWT 處理
- Token 有效期設為 24 小時
- 使用強隨機密鑰 (至少 256 位元)
- 在 Authorization header 中傳遞 token: `Bearer <token>`

### 輸入驗證
- 所有 API 輸入都必須通過 Joi 驗證
- 驗證失敗時回傳詳細的錯誤訊息
- 對所有字串輸入進行 trim 處理

## 資料庫操作標準

### Sequelize 使用規範
- 使用 UUID 作為主鍵
- 所有模型都必須包含 `createdAt` 和 `updatedAt` 欄位
- 使用軟刪除而非實際刪除資料
- 在常用查詢欄位建立索引

### Migration 規範
- 每個 migration 檔案只處理一個邏輯變更
- Migration 檔案必須可以向上和向下執行
- 在 migration 中建立必要的索引
- 使用描述性的 migration 檔案名稱

## 測試標準

### 測試覆蓋率
- 單元測試覆蓋率至少 80%
- 所有 API 端點都必須有整合測試
- 所有錯誤情況都必須有測試案例

### 測試組織
- 使用 `describe` 和 `it` 組織測試案例
- 測試描述使用正體中文
- 每個測試案例都應該獨立且可重複執行
- 使用 `beforeEach` 和 `afterEach` 清理測試環境

### 測試資料
- 使用 factory 模式建立測試資料
- 不依賴外部服務或真實資料庫
- 使用 SQLite 記憶體資料庫進行測試

## API 設計標準

### RESTful 設計
- 使用標準 HTTP 方法 (GET, POST, PUT, DELETE)
- 使用複數名詞作為資源名稱 (例如: `/users`, `/services`)
- 使用 HTTP 狀態碼表示操作結果
- 回傳一致的 JSON 格式

### 回應格式
```typescript
// 成功回應
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// 分頁回應
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}
```

## 環境設定

### 環境變數
- 使用 `.env` 檔案管理環境變數
- 敏感資訊不可提交到版本控制
- 提供 `.env.example` 作為範本
- 所有環境變數都必須有預設值或驗證

### 必要環境變數
```
NODE_ENV=development
PORT=3000
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=12
```