# Service Booking API 專案概述

## 專案目的
這是一個服務預約管理系統的後端 API，提供完整的會員管理、服務管理和預約功能。

## 技術棧
- **語言**：TypeScript 5.3.3
- **執行環境**：Node.js 20.10.0
- **Web 框架**：Koa 2.14.2
- **資料庫**：SQLite 3.x + Sequelize ORM 6.35.2
- **認證**：JWT (jsonwebtoken 9.0.2)
- **密碼加密**：bcrypt 5.1.1
- **資料驗證**：Joi 17.11.0
- **測試框架**：Jest 29.7.0 + ts-jest
- **程式碼品質**：ESLint + Prettier

## 核心功能模組
1. **認證系統** (`/auth`)
   - 會員註冊
   - 登入/登出
   - JWT Token 管理
   - 密碼加密

2. **服務管理** (`/services`)
   - CRUD 操作
   - 服務列表查詢
   - 服務詳情

3. **資料管理**
   - Sequelize ORM
   - 資料庫遷移
   - 種子資料

4. **系統功能**
   - 健康檢查 (`/health`)
   - 錯誤處理
   - 日誌記錄
   - 輸入驗證

## 環境設定
- 開發環境：使用 ts-node-dev 支援熱重載
- 測試環境：使用記憶體資料庫
- 生產環境：編譯後的 JavaScript 執行

## 專案特色
- 完整的 TypeScript 型別安全
- 分層架構設計（MVC + Repository Pattern）
- 統一的 API 回應格式
- 完善的錯誤處理機制
- 80% 以上的測試覆蓋率要求