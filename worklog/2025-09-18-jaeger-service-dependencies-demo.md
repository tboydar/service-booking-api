# Worklog: Jaeger 服務依賴關係 Demo 實作
**日期**: 2025-09-18
**任務**: 建立 Jaeger 服務依賴關係展示功能給老闆 Demo

## 📋 任務背景
用戶需要展示 Jaeger Dependencies 頁面的服務依賴關係功能，作為向老闆展示分散式追蹤能力的 Demo。

## 🎯 完成項目

### 1. 建立模擬外部支付服務
- ✅ 創建 `payment-service.js` (JavaScript 版本，避免 TypeScript 編譯問題)
- ✅ 配置 OpenTelemetry 追蹤，服務名稱為 `payment-service`
- ✅ 實作以下端點：
  - GET `/health` - 健康檢查
  - POST `/api/payment/process` - 處理支付（90% 成功率）
  - POST `/api/payment/refund` - 處理退款
  - GET `/api/payment/status/:id` - 查詢支付狀態

### 2. 整合預約功能與外部服務調用
- ✅ 創建 `BookingController` 實作預約邏輯
- ✅ 在 `/booking/create` 端點中調用外部支付服務
- ✅ 實作完整的追蹤鏈路：
  ```
  service-booking-api
    └── booking.create_with_payment
        ├── booking.verify_service
        ├── external.payment_service (調用 payment-service)
        │   └── payment.process
        │       ├── payment.verify
        │       └── bank.transaction
        └── booking.save_record
  ```

### 3. 產生服務依賴數據
- ✅ 在資料庫中創建測試服務記錄
- ✅ 執行 50+ 次預約創建請求
- ✅ 成功率約 90%，產生足夠的追蹤數據

## 🔧 技術挑戰與解決方案

### 問題 1: TypeScript 編譯錯誤
**問題**: `mock-payment-service.ts` 出現環境變數類型錯誤
**解決**: 改用 JavaScript 版本 (`payment-service.js`)

### 問題 2: Service Not Found 錯誤
**問題**: BookingController 無法找到服務記錄
**原因**: Service model 與資料庫 schema 不一致
**解決**: 直接在 SQLite 資料庫插入測試數據

### 問題 3: 服務名稱顯示錯誤
**問題**: Jaeger 顯示 "unknown_service" 而非實際服務名
**解決**: 設定 `OTEL_SERVICE_NAME` 和 `OTEL_RESOURCE_ATTRIBUTES` 環境變數

## 📊 Demo 成果

### 服務架構
```
┌─────────────────┐       ┌──────────────┐
│ service-booking │──────▶│ payment      │
│ -api (port 3000)│       │ -service     │
└─────────────────┘       │ (port 3001)  │
         │                └──────────────┘
         │                        │
         ▼                        ▼
    ┌─────────────────────────────────┐
    │  Jaeger (port 16686)            │
    │  - 收集追蹤數據                  │
    │  - 顯示服務依賴關係              │
    └─────────────────────────────────┘
```

### 驗證步驟
1. 服務列表: http://localhost:16686/search
2. 依賴關係圖: http://localhost:16686/dependencies
3. 追蹤詳情: 可查看完整請求鏈路

## 📝 部署注意事項

### VM 部署需要開放的 Ports
- **16686**: Jaeger UI (必須)
- **4318**: OTLP HTTP 接收端點 (必須)
- **4317**: OTLP gRPC (選擇性)
- **14268**: Jaeger Thrift HTTP (選擇性)
- **9411**: Zipkin 相容端點 (選擇性)

### 安全建議
- 生產環境使用反向代理 + SSL
- 限制 4318 port 只接受應用伺服器連線
- UI 添加基本認證保護

## 💡 學習要點
1. OpenTelemetry 與 Jaeger 的整合方式
2. 分散式追蹤的 Span 和 Trace 概念
3. 服務依賴關係的自動發現機制
4. BadgerDB 作為輕量級儲存後端的應用

## 📌 後續優化建議
1. 添加更多微服務來展示複雜依賴關係
2. 實作錯誤注入來展示錯誤追蹤能力
3. 添加性能測試來展示瓶頸分析功能
4. 整合 Grafana 來展示追蹤指標

## 🔗 相關文件
- [Jaeger README](../jaeger/readme.md)
- [OpenTelemetry 配置](../src/tracing.ts)
- [Docker Compose 配置](../jaeger/docker-compose-v2.yml)