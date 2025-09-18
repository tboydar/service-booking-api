# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個基於 TypeScript + Node.js + Koa + SQLite 的服務預約管理系統 API。專案使用分層架構設計，包含完整的認證、資料驗證和錯誤處理機制。

## 核心開發指令

### 基本開發流程
```bash
# 安裝依賴
npm install

# 開發模式（熱重載）
npm run dev

# 建置專案
npm run build

# 執行生產環境
npm start
```

### 資料庫操作
```bash
# 初始化資料庫
npm run db:init

# 執行資料庫遷移
npm run migrate

# 回滾遷移
npm run migrate:undo

# 載入種子資料
npm run seed

# 檢查資料庫健康狀態
npm run db:health
```

### 程式碼品質檢查
```bash
# 執行 ESLint 檢查（必須在提交前執行）
npm run lint

# 自動修正 ESLint 問題
npm run lint:fix

# 格式化程式碼（Prettier）
npm run format
```

### 測試指令
```bash
# 執行所有測試
npm test

# 監視模式（開發時使用）
npm run test:watch

# 測試覆蓋率要求：80%
```

## 專案架構

### 分層架構模式
- **Routes** → **Controllers** → **Services** → **Repositories** → **Models**
- 每層都有明確的職責分離
- 使用依賴注入模式

### 目錄結構
```
src/
├── config/          # 配置檔案（資料庫、JWT、環境變數）
├── controllers/     # 控制器層（處理 HTTP 請求）
├── services/        # 服務層（業務邏輯）
├── repositories/    # 資料存取層（資料庫操作）
├── models/          # Sequelize 資料模型
├── middlewares/     # Koa 中介軟體（認證、錯誤處理、驗證）
├── routes/          # API 路由定義
├── database/        # 資料庫遷移和種子檔案
├── utils/           # 工具函數
├── types/           # TypeScript 型別定義
└── validation/      # Joi 驗證 schema
```

### TypeScript 配置特點
- **嚴格模式**：所有 strict 選項都已啟用
- **路徑別名**：使用 `@/` 作為 src 目錄的別名
- **型別安全**：禁止隱式 any、要求明確的函數返回類型

## 重要技術細節

### 資料庫配置
- 使用 SQLite 作為資料庫（檔案位置：`./database.sqlite`）
- Sequelize ORM 管理資料庫操作
- 支援資料庫遷移和種子資料
- 資料庫配置檔案：`src/config/database-cli.js`（給 Sequelize CLI 使用）

### 認證機制
- JWT Token 認證
- bcrypt 密碼加密（12 rounds）
- Token 有效期：24 小時

### API 結構
- RESTful API 設計
- 統一的回應格式：`{ success: boolean, data?: any, error?: { code, message, details } }`
- 使用 Joi 進行請求資料驗證

### 錯誤處理
- 集中式錯誤處理中介軟體
- 結構化錯誤回應
- 詳細的錯誤日誌記錄

## 開發注意事項

### 必須遵循的規範
1. **所有函數必須明確定義返回類型**（TypeScript strict 模式）
2. **禁止使用 any 類型**
3. **禁止使用 console.log**（使用專案的 logger）
4. **變數必須使用 const 或 let，禁止 var**
5. **未使用的變數和參數會導致編譯錯誤**

### 環境變數設定
開發前必須設定 `.env` 檔案（參考 `.env.example`）：
- `JWT_SECRET`：必須更改預設值
- `DATABASE_URL`：資料庫連線字串
- `NODE_ENV`：環境設定（development/test/production）

### 測試要求
- 測試覆蓋率必須達到 80% 以上
- 測試檔案放在對應的目錄中，命名為 `*.test.ts` 或 `*.spec.ts`
- 使用 Jest 作為測試框架，ts-jest 處理 TypeScript

### 提交前檢查清單
1. 執行 `npm run lint` 確保程式碼符合規範
2. 執行 `npm test` 確保所有測試通過
3. 確保測試覆蓋率達到 80%
4. 執行 `npm run build` 確保 TypeScript 編譯成功

## 常用開發模式

### 新增 API 端點
1. 在 `src/routes/` 定義路由
2. 在 `src/controllers/` 建立控制器
3. 在 `src/services/` 實作業務邏輯
4. 在 `src/repositories/` 處理資料庫操作
5. 在 `src/validation/` 定義輸入驗證 schema

### 新增資料模型
1. 在 `src/models/` 定義 Sequelize 模型
2. 建立遷移檔案：`npm run migrate:create -- --name=<migration-name>`
3. 執行遷移：`npm run migrate`

### 除錯資料庫問題
```bash
# 檢查資料庫狀態
npm run db:stats

# 驗證資料庫設定
npm run db:verify

# 查看遷移狀態
npm run migrate:status
```