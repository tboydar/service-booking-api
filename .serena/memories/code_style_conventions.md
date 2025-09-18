# 程式碼風格與規範

## TypeScript 嚴格模式
- **所有 strict 選項已啟用**
- 必須明確定義函數返回類型
- 禁止隱式 any 類型
- 禁止未使用的變數和參數
- 必須處理可能的 null/undefined

## 命名規範
- 檔案名稱：kebab-case（例：`user-service.ts`）
- 類別名稱：PascalCase（例：`UserService`）
- 函數和變數：camelCase（例：`getUserById`）
- 常數：UPPER_SNAKE_CASE（例：`MAX_RETRY_COUNT`）
- 介面：以 I 開頭的 PascalCase（例：`IUserData`）

## 路徑別名
使用 `@/` 作為 src 目錄的別名：
- `@/controllers/*`
- `@/services/*`
- `@/repositories/*`
- `@/models/*`
- `@/middlewares/*`
- `@/utils/*`
- `@/config/*`
- `@/types/*`

## ESLint 規則
- 禁止使用 var，必須使用 const 或 let
- 禁止使用 console.log（使用專案的 logger）
- 必須使用分號結尾
- 2 空格縮排

## 分層架構規範
- Routes → Controllers → Services → Repositories → Models
- 每層只能依賴下層，不能跨層調用
- Controllers 處理 HTTP 請求/回應
- Services 包含業務邏輯
- Repositories 處理資料庫操作
- Models 定義資料結構

## 錯誤處理
- 使用自定義 AppError 類別
- 統一的錯誤回應格式
- 集中式錯誤處理中介軟體