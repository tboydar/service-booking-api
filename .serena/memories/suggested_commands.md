# 常用開發指令

## 基本開發
- `npm install` - 安裝依賴套件
- `npm run dev` - 開發模式（支援熱重載）
- `npm run build` - 編譯 TypeScript 為 JavaScript
- `npm start` - 執行生產環境

## 資料庫操作
- `npm run db:init` - 初始化資料庫
- `npm run migrate` - 執行資料庫遷移
- `npm run migrate:undo` - 回滾最近的遷移
- `npm run migrate:status` - 查看遷移狀態
- `npm run seed` - 載入種子資料
- `npm run db:health` - 檢查資料庫健康狀態
- `npm run db:stats` - 查看資料庫統計資訊

## 程式碼品質
- `npm run lint` - ESLint 程式碼檢查（提交前必須執行）
- `npm run lint:fix` - 自動修正 ESLint 問題
- `npm run format` - 使用 Prettier 格式化程式碼

## 測試
- `npm test` - 執行所有測試
- `npm run test:watch` - 監視模式（開發時使用）

## Sequelize CLI
- `npm run migrate:create -- --name=<name>` - 建立新的遷移檔案
- `npm run seed:create -- --name=<name>` - 建立新的種子檔案