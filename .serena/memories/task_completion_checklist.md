# 任務完成檢查清單

## 新功能開發完成後
1. **程式碼品質檢查**
   - 執行 `npm run lint` 確保沒有 ESLint 錯誤
   - 執行 `npm run format` 格式化程式碼

2. **測試**
   - 執行 `npm test` 確保所有測試通過
   - 確認測試覆蓋率達到 80% 以上
   - 為新功能編寫對應的測試

3. **TypeScript 編譯**
   - 執行 `npm run build` 確保編譯成功
   - 確認沒有型別錯誤

4. **資料庫**
   - 如果有資料庫變更，建立並執行遷移
   - 執行 `npm run db:health` 確認資料庫正常

## API 端點開發完成後
1. 確認已實作以下層級：
   - Route 定義
   - Controller 處理
   - Service 業務邏輯
   - Repository 資料存取
   - Validation schema

2. 確認錯誤處理完整
3. 確認回應格式統一

## 提交程式碼前
1. 執行 `npm run lint`
2. 執行 `npm test`
3. 執行 `npm run build`
4. 檢查環境變數是否正確設定