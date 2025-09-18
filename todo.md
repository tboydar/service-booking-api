# TODO List

## 📋 專案概述
- [ ] 建立「最小可用」的服務管理後端系統
- [ ] 完成時限：2025-09-19（五）
- [ ] 預設 3 小時內完成

## 🛠 技術棧設定

### 必要技術
- [ ] TypeScript + Node.js
- [ ] Koa 框架
- [ ] Sequelize ORM
- [ ] SQLite
- [ ] Joi 驗證
- [ ] JWT 認證
- [ ] bcrypt 密碼加密

### 加分項目
- [ ] Moleculer 微服務框架
- [ ] Jest 測試框架
- [ ] ESLint / Prettier
- [ ] CI/CD 配置（npm run test）

## 📁 專案結構

### 目錄架構
- [ ] `/controllers` - 控制器層
- [ ] `/services` - 商業邏輯層
- [ ] `/repositories` - 資料存取層
- [ ] `/models` - 資料模型
- [ ] `/middlewares` - 中介軟體
- [ ] `/utils` - 工具函數
- [ ] `.env` - 環境變數設定

## 🗄 資料庫設計

### Users 表
- [ ] id (UUID, PRIMARY KEY)
- [ ] email (VARCHAR(255), UNIQUE)
- [ ] password (VARCHAR(255), 雜湊儲存)
- [ ] name (VARCHAR(255))
- [ ] createdAt (TIMESTAMP)
- [ ] updatedAt (TIMESTAMP)

### AppointmentServices 表
- [ ] id (UUID, PRIMARY KEY)
- [ ] name (VARCHAR(255))
- [ ] description (TEXT)
- [ ] price (INTEGER)
- [ ] showTime (INTEGER)
- [ ] order (INTEGER, DEFAULT 0)
- [ ] isRemove (BOOLEAN, DEFAULT false)
- [ ] isPublic (BOOLEAN, DEFAULT true)
- [ ] createdAt (TIMESTAMP)
- [ ] updatedAt (TIMESTAMP)

### 資料庫操作
- [ ] 建立 migration 檔案
- [ ] 建立 seed 檔案
- [ ] 建立索引（appointment_services__shop_id）

## 🔌 API 開發

### 會員功能
- [ ] **POST /register** - 會員註冊
  - [ ] 接收 email、password、name
  - [ ] 密碼雜湊處理
  - [ ] Email 唯一性驗證
  - [ ] 回傳成功訊息

- [ ] **POST /login** - 會員登入
  - [ ] 驗證 email、password
  - [ ] 生成 JWT token
  - [ ] 回傳 token

### 服務（Service）CRUD
- [ ] **GET /services** - 查詢服務列表（公開）
  - [ ] 不需 JWT
  - [ ] 只顯示 isPublic=true 的服務
  - [ ] 支援分頁

- [ ] **GET /services/:id** - 查詢單一服務（公開）
  - [ ] 不需 JWT
  - [ ] 檢查 isPublic 狀態

- [ ] **POST /services** - 新增服務（需 JWT）
  - [ ] JWT 驗證
  - [ ] Joi 輸入驗證
  - [ ] 儲存服務資料

- [ ] **PUT /services/:id** - 更新服務（需 JWT）
  - [ ] JWT 驗證
  - [ ] Joi 輸入驗證
  - [ ] 更新服務資料

- [ ] **DELETE /services/:id** - 刪除服務（需 JWT）
  - [ ] JWT 驗證
  - [ ] 軟刪除（設定 isRemove=true）

### API 回應格式
- [ ] 成功回應：`{ "data": ... }`
- [ ] 錯誤回應：`{ "error": { "code": "xxx", "message": "..." } }`

## 🔒 安全性實作

- [ ] 密碼雜湊（bcrypt）
- [ ] JWT middleware 實作
- [ ] Joi 請求驗證
- [ ] 集中