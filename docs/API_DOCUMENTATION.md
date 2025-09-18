# API 文檔使用指南

## 📚 Swagger/OpenAPI 文檔

本系統已整合 **Swagger UI** 提供互動式 API 文檔。

### 🚀 訪問 API 文檔

啟動服務器後，可以通過以下方式訪問 API 文檔：

#### 1. Swagger UI（互動式介面）
```
http://localhost:3000/api-docs
```

#### 2. OpenAPI JSON 規格
```
http://localhost:3000/api-docs/json
```

### 📖 功能特點

1. **互動式測試**
   - 直接在瀏覽器中測試 API
   - 自動生成請求範例
   - 即時查看響應結果

2. **完整的 API 說明**
   - 請求參數說明
   - 響應格式範例
   - 錯誤代碼說明
   - 認證方式說明

3. **分類瀏覽**
   - Authentication - 認證相關
   - Services - 服務管理
   - Admin - 管理後台
   - Health - 健康檢查

### 🔐 測試認證 API

#### 1. 登入獲取 Token
在 Swagger UI 中：
1. 找到 **Authentication** 分類
2. 點擊 **POST /auth/login**
3. 點擊 **Try it out**
4. 使用以下憑證：
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```
5. 點擊 **Execute**
6. 複製響應中的 `token`

#### 2. 設置授權 Token
1. 點擊頁面右上角的 **Authorize** 按鈕
2. 在彈出視窗中輸入：`Bearer [你的token]`
3. 點擊 **Authorize**
4. 現在可以測試需要認證的 API

### 📝 API 端點概覽

#### 公開 API（無需認證）
- `GET /health` - 健康檢查
- `POST /auth/login` - 用戶登入
- `POST /auth/register` - 用戶註冊
- `GET /services` - 獲取服務列表
- `GET /services/{id}` - 獲取服務詳情

#### 需要認證的 API
- `POST /services` - 創建服務
- `PUT /services/{id}` - 更新服務
- `DELETE /services/{id}` - 刪除服務
- `GET /admin/*` - 管理後台相關

### 🛠️ 開發者指南

#### 添加新的 API 文檔

1. **在控制器中添加 Swagger 註解**

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: 端點摘要
 *     description: 詳細描述
 *     tags: [分類標籤]
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *         description: 參數說明
 *     responses:
 *       200:
 *         description: 成功響應
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
```

2. **定義資料模型**

在 `src/config/swagger.ts` 中的 `components.schemas` 添加：

```typescript
YourModel: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  }
}
```

### 📦 導出 API 規格

可以將 API 規格導出為各種格式：

#### 導出為 JSON
```bash
curl http://localhost:3000/api-docs/json > openapi.json
```

#### 導出為 YAML（需要轉換工具）
```bash
npm install -g json2yaml
curl http://localhost:3000/api-docs/json | json2yaml > openapi.yaml
```

### 🔧 配置選項

Swagger UI 配置位於 `src/routes/swagger-routes.ts`：

```typescript
const swaggerOptions = {
  routePrefix: '/api-docs',        // API 文檔路徑
  swaggerOptions: {
    url: '/api-docs/json',         // OpenAPI 規格位置
    deepLinking: true,             // 深度連結
    tryItOutEnabled: true,         // 啟用試用功能
    filter: true,                  // 搜尋過濾
    displayRequestDuration: true,  // 顯示請求時間
  }
};
```

### 📋 常用測試案例

#### 1. 測試認證流程
```bash
# 登入
POST /auth/login
{
  "email": "admin@example.com",
  "password": "Admin123!"
}

# 使用 Token 訪問受保護資源
GET /services
Authorization: Bearer {token}
```

#### 2. 測試服務 CRUD
```bash
# 創建服務（需要認證）
POST /services
{
  "name": "瑜伽課程",
  "duration": 60,
  "price": 500,
  "maxCapacity": 10
}

# 更新服務（需要認證）
PUT /services/{id}
{
  "price": 600
}

# 刪除服務（需要認證）
DELETE /services/{id}
```

### 🌐 其他 API 文檔工具整合

本系統的 OpenAPI 規格也可以導入其他工具：

- **Postman**: Import > Raw text > 貼上 JSON
- **Insomnia**: Import/Export > Import Data > From URL
- **Bruno**: Import > OpenAPI 3.0
- **Thunder Client**: Collections > Import > OpenAPI

### 📚 相關資源

- [OpenAPI 規格](https://swagger.io/specification/)
- [Swagger UI 文檔](https://swagger.io/tools/swagger-ui/)
- [JSDoc 註解指南](https://github.com/Surnet/swagger-jsdoc)

### ⚠️ 注意事項

1. **生產環境安全性**
   - 考慮在生產環境中限制 API 文檔訪問
   - 可以添加認證保護 `/api-docs` 路徑
   - 避免暴露敏感資訊

2. **性能考慮**
   - Swagger UI 會載入大量資源
   - 在生產環境可考慮使用 CDN 版本
   - 可以按需載入或延遲載入

3. **版本管理**
   - 記得更新 API 版本號
   - 保持文檔與實際 API 同步
   - 使用語義化版本控制