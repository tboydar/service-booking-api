# 實作計劃

- [x] 1. 建立專案結構和核心設定
  - 初始化 TypeScript + Node.js 專案結構
  - 設定 package.json 和相關依賴套件
  - 建立分層目錄結構 (controllers, services, repositories, models, middlewares, utils)
  - 設定 TypeScript 編譯設定和 ESLint/Prettier
  - 建立 .env 設定檔案管理
  - _需求: 6.1, 6.2, 6.3, 6.4_

- [x] 2. 設定資料庫和 ORM
  - 設定 Sequelize 連接 SQLite 資料庫
  - 建立資料庫設定檔案和連接工具
  - 設定 Sequelize CLI 和 migration 環境
  - _需求: 6.1, 6.2, 6.3, 6.4_

- [x] 3. 建立資料模型和 Migration
  - 建立 User 模型和對應的 TypeScript 介面
  - 建立 AppointmentService 模型和對應的 TypeScript 介面
  - 撰寫 Users 表格的 migration 檔案
  - 撰寫 AppointmentServices 表格的 migration 檔案
  - 建立必要的資料庫索引
  - _需求: 6.1, 6.2, 6.3, 6.4_

- [x] 4. 實作輸入驗證 Schema
  - 建立 Joi 驗證 schema 檔案
  - 實作會員註冊驗證 schema (email, password, name)
  - 實作會員登入驗證 schema (email, password)
  - 實作服務建立/更新驗證 schema (name, description, price, showTime, order, isPublic)
  - _需求: 5.1, 5.2_

- [x] 5. 建立核心中介軟體
  - 實作錯誤處理中介軟體，統一錯誤回應格式
  - 實作輸入驗證中介軟體，整合 Joi schema 驗證
  - 實作 JWT 驗證中介軟體，驗證 token 有效性
  - 實作 CORS 中介軟體設定
  - 撰寫中介軟體的單元測試
  - _需求: 5.3, 5.4_

- [x] 6. 實作密碼處理工具
  - 建立密碼雜湊工具函數 (使用 bcrypt)
  - 建立密碼驗證工具函數
  - 建立 JWT token 生成和驗證工具函數
  - 撰寫密碼處理工具的單元測試
  - _需求: 1.3, 2.3, 5.4_

- [x] 7. 實作 Repository 層
  - 建立 UserRepository 類別，實作基本 CRUD 操作
  - 建立 AppointmentServiceRepository 類別，實作基本 CRUD 操作
  - 實作 UserRepository 的 findByEmail 方法
  - 實作 AppointmentServiceRepository 的查詢公開服務方法
  - 撰寫 Repository 層的單元測試
  - _需求: 1.1, 2.1, 3.1, 3.2, 4.1, 4.2, 4.3_

- [x] 8. 實作 Service 層業務邏輯
  - 建立 AuthService 類別，實作註冊和登入邏輯
  - 建立 ServiceManagementService 類別，實作服務管理邏輯
  - 實作 AuthService 的 register 方法 (包含密碼雜湊)
  - 實作 AuthService 的 login 方法 (包含密碼驗證和 JWT 生成)
  - 實作 ServiceManagementService 的所有 CRUD 方法
  - 撰寫 Service 層的單元測試
  - _需求: 1.1, 1.3, 1.4, 2.1, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. 實作 Controller 層
  - 建立 AuthController 類別，處理認證相關的 HTTP 請求
  - 建立 ServiceController 類別，處理服務管理的 HTTP 請求
  - 實作 AuthController 的 register 和 login 端點
  - 實作 ServiceController 的所有 CRUD 端點
  - 整合輸入驗證中介軟體到各個端點
  - 撰寫 Controller 層的單元測試
  - _需求: 1.1, 1.2, 1.4, 2.1, 2.2, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10. 設定路由和 Koa 應用程式
  - 建立路由設定檔案，定義所有 API 端點
  - 設定 Koa 應用程式主檔案
  - 整合所有中介軟體到 Koa 應用程式
  - 設定路由中介軟體和控制器
  - 實作應用程式啟動邏輯
  - _需求: 1.1, 1.2, 1.4, 2.1, 2.2, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. 建立資料庫 Seed 檔案
  - 撰寫測試用的 User seed 資料
  - 撰寫測試用的 AppointmentService seed 資料
  - 設定 Sequelize seeder 執行腳本
  - 確保 seed 資料符合驗證規則
  - _需求: 6.4_

- [x] 12. 實作整合測試
  - 設定測試環境和測試資料庫
  - 撰寫會員註冊 API 的整合測試
  - 撰寫會員登入 API 的整合測試
  - 撰寫服務查詢 API 的整合測試 (公開端點)
  - 撰寫服務管理 API 的整合測試 (需權限端點)
  - 測試錯誤處理和邊界情況
  - _需求: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

- [x] 13. 建立專案文件和執行腳本
  - 撰寫詳細的 README.md 檔案
  - 建立 npm 執行腳本 (start, dev, test, build, migrate, seed)
  - 設定 CI/CD 相關的 npm test 腳本
  - 建立 API 文件或 Postman collection
  - _需求: 6.1, 6.2, 6.3, 6.4_

- [x] 14. 最終整合和測試
  - 執行完整的資料庫 migration 和 seed
  - 進行端到端測試，驗證所有功能流程
  - 測試錯誤處理和安全性功能
  - 驗證所有需求都已實作完成
  - 進行代碼品質檢查 (ESLint, Prettier)
  - _需求: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_