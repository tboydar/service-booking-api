# 輸入驗證模組

本模組提供完整的輸入驗證功能，使用 Joi 進行資料驗證。

## 功能特色

- 統一的驗證介面和錯誤處理
- 支援中文錯誤訊息
- 自動資料清理和轉換
- 完整的 TypeScript 型別支援
- 可重用的驗證工具函數

## 模組結構

```
src/validation/
├── auth.schemas.ts          # 認證相關驗證 schema
├── service.schemas.ts       # 服務管理驗證 schema
├── validation.utils.ts      # 驗證工具函數
├── index.ts                # 統一匯出
└── __tests__/              # 測試檔案
    ├── auth.schemas.test.ts
    ├── service.schemas.test.ts
    └── validation.utils.test.ts
```

## 使用方式

### 基本驗證

```typescript
import { ValidationUtils, registerSchema } from '@/validation';

const userData = {
  email: 'user@example.com',
  password: 'password123',
  name: 'Test User'
};

const result = ValidationUtils.validate(registerSchema, userData);

if (result.success) {
  console.log('驗證成功:', result.data);
} else {
  console.log('驗證失敗:', result.errors);
}
```

### 錯誤處理

```typescript
if (!result.success) {
  const errorMessage = ValidationUtils.formatValidationErrors(result.errors);
  console.log('錯誤訊息:', errorMessage);
}
```

## 可用的 Schema

### 認證相關

- `registerSchema` - 會員註冊驗證
- `loginSchema` - 會員登入驗證

### 服務管理

- `createServiceSchema` - 服務建立驗證
- `updateServiceSchema` - 服務更新驗證
- `uuidParamSchema` - UUID 參數驗證

## 驗證規則

### 會員註冊

- **email**: 必填，有效的 email 格式，自動轉小寫
- **password**: 必填，最少 6 個字元，最多 128 個字元
- **name**: 必填，最少 2 個字元，最多 50 個字元，自動清理空白

### 會員登入

- **email**: 必填，有效的 email 格式，自動轉小寫
- **password**: 必填

### 服務建立

- **name**: 必填，最少 1 個字元，最多 255 個字元，自動清理空白
- **description**: 可選，最多 1000 個字元，自動清理空白
- **price**: 必填，非負整數
- **showTime**: 可選，非負整數
- **order**: 可選，非負整數，預設值 0
- **isPublic**: 可選，布林值，預設值 true

### 服務更新

- 所有欄位都是可選的，但至少需要提供一個欄位
- 驗證規則與服務建立相同

### UUID 參數

- **id**: 必填，有效的 UUID v4 格式

## 工具函數

### ValidationUtils.validate()

執行驗證並回傳統一格式的結果。

### ValidationUtils.formatValidationErrors()

格式化驗證錯誤訊息為可讀的字串。

### ValidationUtils.isValidUUID()

檢查字串是否為有效的 UUID v4 格式。

### ValidationUtils.normalizeEmail()

標準化 email 格式（轉小寫、清理空白）。

### ValidationUtils.sanitizeString()

清理字串，移除多餘空白。