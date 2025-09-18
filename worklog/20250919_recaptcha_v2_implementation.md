# Google reCAPTCHA v2 實作工作日誌

## 日期
2025-09-19

## 功能描述
實作 Google reCAPTCHA v2「我不是機器人」核取方塊驗證功能，用於保護 API 端點免受機器人攻擊。

## 實作範圍

### 1. reCAPTCHA 服務層
- **檔案**: `src/services/recaptcha.service.ts`
- **功能**:
  - 與 Google reCAPTCHA API 通訊
  - 驗證使用者提供的 token
  - 處理驗證結果與錯誤
  - 提供錯誤訊息翻譯

### 2. reCAPTCHA 中介軟體
- **檔案**: `src/middlewares/recaptcha.middleware.ts`
- **功能**:
  - `recaptchaMiddleware`: 強制要求 reCAPTCHA 驗證
  - `optionalRecaptchaMiddleware`: 選擇性驗證（用於登入端點）
  - `devRecaptchaMiddleware`: 開發環境可跳過驗證
  - 整合錯誤處理機制

### 3. 展示頁面（Boss Demo）
建立了完整的展示中心，方便向主管展示功能：

#### 展示首頁
- **檔案**: `public/demo/index.html`
- **URL**: http://localhost:3000/demo/
- **功能**:
  - 功能總覽
  - 測試金鑰資訊
  - 導航到各展示頁面

#### 註冊展示頁面
- **檔案**: `public/demo/register.html`
- **URL**: http://localhost:3000/demo/register.html
- **功能**:
  - 完整的註冊表單
  - reCAPTCHA v2 勾選框整合
  - 即時驗證回饋
  - 成功/失敗動畫效果

#### 登入展示頁面
- **檔案**: `public/demo/login.html`
- **URL**: http://localhost:3000/demo/login.html
- **功能**:
  - 登入表單
  - 測試帳號快速填入
  - reCAPTCHA 驗證
  - 記住我功能

#### API 測試工具
- **檔案**: `public/demo/api-test.html`
- **URL**: http://localhost:3000/demo/api-test.html
- **功能**:
  - 視覺化 API 測試介面
  - Postman 整合範例
  - cURL 指令範例
  - 即時測試結果顯示

### 4. 路由整合
- **更新檔案**: `src/routes/auth-routes.ts`
- **整合點**:
  - `/auth/register` - 使用 `optionalRecaptchaMiddleware`
  - `/auth/login` - 使用 `optionalRecaptchaMiddleware`

### 5. 環境設定
- **更新檔案**: `src/config/environment.ts`
- **新增設定**:
  ```typescript
  RECAPTCHA_ENABLED: boolean
  RECAPTCHA_SITE_KEY: string
  RECAPTCHA_SECRET_KEY: string
  ```

### 6. Postman 測試案例
- **更新檔案**: `postman.http`
- **新增測試**:
  - 含 reCAPTCHA token 的註冊
  - 缺少 reCAPTCHA token 的註冊（失敗）
  - 含 reCAPTCHA token 的登入
  - 無效 reCAPTCHA token 測試

## 技術決策

### 為什麼選擇 reCAPTCHA v2 而非 v3？
1. **視覺化展示**: v2 有明顯的「我不是機器人」勾選框，適合向主管展示
2. **使用者互動**: 使用者可以清楚看到並理解驗證過程
3. **圖片挑戰**: 可能觸發圖片選擇，展示多層防護機制
4. **廣泛支援**: v2 在各種瀏覽器和裝置上都有良好支援

### 設計特色
1. **彈性架構**: 三種不同的中介軟體適應不同場景
2. **優雅降級**: 當 reCAPTCHA 服務不可用時，系統仍可運作
3. **開發友善**: 開發環境可輕鬆跳過驗證
4. **完整展示**: 專業的 demo 頁面，展示所有功能

## 測試金鑰
使用 Google 提供的測試金鑰，永遠會通過驗證：
- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

## API 測試範例

### 使用 cURL 測試
```bash
# 含 reCAPTCHA token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "g-recaptcha-response": "test-token-from-google"
  }'

# 不含 reCAPTCHA token（會根據設定決定是否允許）
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

### 使用展示頁面測試
1. 開啟瀏覽器訪問 http://localhost:3000/demo/
2. 選擇「會員註冊」或「會員登入」
3. 填寫表單並勾選「我不是機器人」
4. 觀察驗證流程和結果

## 檔案清單
新增和修改的檔案：
- `src/services/recaptcha.service.ts` - reCAPTCHA 服務
- `src/middlewares/recaptcha.middleware.ts` - 中介軟體
- `src/routes/auth-routes.ts` - 路由整合
- `src/config/environment.ts` - 環境設定
- `public/demo/index.html` - 展示首頁
- `public/demo/register.html` - 註冊展示
- `public/demo/login.html` - 登入展示
- `public/demo/api-test.html` - API 測試工具
- `postman.http` - API 測試案例

## 注意事項
1. 生產環境必須更換為正式的 reCAPTCHA 金鑰
2. 可根據需求調整驗證嚴格程度（強制/選擇性）
3. 建議配合速率限制功能一起使用，提供多層防護
4. 確保 CORS 設定允許 Google reCAPTCHA 域名

## 下一步建議
1. 申請正式的 reCAPTCHA 金鑰
2. 實作 reCAPTCHA v3（無形驗證）作為補充
3. 加入驗證分數門檻設定
4. 實作驗證失敗的重試機制
5. 加入驗證統計和監控