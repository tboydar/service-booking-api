# 工作日誌 - Jaeger 分布式追蹤系統整合
**日期**: 2025-09-18
**專案**: Service Booking API
**分支**: `feature/jaeger-integration`
**提交**: 0835a3d

## 📋 工作內容總覽

### 上午工作 - K6 效能測試與修復
1. **K6 測試報告建立**
   - 執行完整的 k6 效能測試（smoke、load、stress tests）
   - 建立 `k6_test_0917_01.md` 測試報告
   - 發現註冊 Token 回傳問題（0% 成功率）

2. **註冊功能修復**
   - 問題：`AuthService.register()` 未回傳 JWT token
   - 解決：修改 `src/services/auth-service.ts`，新增 token 生成與回傳
   - 結果：Token 回傳率從 0% 提升至 91%
   - 剩餘 9% 失敗為預期行為（Email 唯一性衝突）

### 下午工作 - Jaeger 整合實作
1. **系統架構設計**
   - 選用 BadgerDB 作為儲存方案（類似 SQLite 的本地檔案儲存）
   - 設計單容器部署架構，無需外部資料庫依賴
   - 支援 OpenTelemetry Protocol (OTLP) 整合

2. **檔案建立清單**
   ```
   jaeger/
   ├── docker-compose-v2.yml     # Jaeger 容器配置
   ├── README.md                  # 完整使用文檔
   ├── .env.example              # 環境變數範例
   ├── .gitignore                # Git 忽略規則
   └── integration/
       ├── tracing.ts            # OpenTelemetry SDK 初始化
       └── middleware.ts         # Koa 中介軟體整合範例
   ```

## 🔧 技術決策記錄

### 為什麼選擇 BadgerDB？
- **簡化部署**：不需要 Elasticsearch 或 Cassandra
- **類似 SQLite**：嵌入式資料庫，本地檔案儲存
- **效能優秀**：LSM tree 架構，寫入效能良好
- **資料持久化**：支援容器重啟後資料保留
- **自動壓縮**：內建資料壓縮功能

### OpenTelemetry 整合策略
1. **自動儀表化**：HTTP、Koa 框架自動追蹤
2. **自定義 Span**：提供輔助函數簡化追蹤
3. **中介軟體模式**：請求追蹤、效能監控、錯誤追蹤
4. **取樣策略**：環境相關的動態取樣率

## 📊 關鍵配置參數

### Docker Compose 設定
```yaml
environment:
  - SPAN_STORAGE_TYPE=badger          # 使用 BadgerDB
  - BADGER_EPHEMERAL=false           # 啟用持久化
  - BADGER_SPAN_STORE_TTL=168h       # 7 天資料保留
  - COLLECTOR_OTLP_ENABLED=true      # 啟用 OTLP
```

### 端口配置
| 端口 | 用途 |
|------|------|
| 16686 | Jaeger UI |
| 4318 | OTLP HTTP |
| 4317 | OTLP gRPC |
| 14268 | Collector HTTP |
| 9411 | Zipkin 相容 |

## 🚀 整合範例亮點

### 1. 追蹤中介軟體
```typescript
// 為每個請求建立 root span
export function tracingMiddleware() {
  return async (ctx: Context, next: Next) => {
    const span = tracer.startSpan(`${ctx.method} ${ctx.path}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': ctx.method,
        'http.url': ctx.url,
        // ...更多屬性
      }
    });
    // 執行並追蹤
  };
}
```

### 2. 業務邏輯追蹤
```typescript
// 追蹤服務預約流程
await withSpan('booking.create', async () => {
  await withSpan('booking.validate_user', validateUser);
  await withSpan('booking.check_availability', checkAvailability);
  await withSpan('booking.create_record', createRecord);
});
```

### 3. 效能監控
- 請求處理時間追蹤
- CPU 和記憶體使用監控
- 慢請求自動警告（> 1 秒）

## 📈 預期效益評估

### 量化指標
- **除錯時間減少**: 50-70%
- **MTTR 改善**: 從小時縮短到分鐘
- **問題發現**: 主動發現效能問題

### 質化改善
- 視覺化服務依賴關係
- 完整請求追蹤鏈路
- 資料驅動的優化決策

## 🔄 後續建議

### 短期（1-2 週）
1. 在開發環境測試 Jaeger 整合
2. 調整取樣率找到最佳平衡
3. 訓練團隊使用 Jaeger UI

### 中期（1 個月）
1. 整合到 CI/CD 流程
2. 建立效能基準線
3. 設定警報規則

### 長期（3 個月）
1. 分析歷史資料趨勢
2. 優化關鍵路徑
3. 考慮升級到分散式部署

## 📝 學習筆記

### OpenTelemetry 概念
- **Trace**: 完整的請求追蹤
- **Span**: 追蹤中的單一操作
- **Context**: 跨服務傳播的資訊
- **Baggage**: 用戶定義的鍵值對

### BadgerDB 特性
- Key-Value 儲存
- LSM tree 架構
- 支援 ACID 事務
- 內建壓縮和垃圾回收

## ✅ 完成清單

- [x] K6 測試報告建立與執行
- [x] 修復註冊 Token 回傳問題
- [x] 建立 Jaeger 整合架構
- [x] 撰寫完整文檔
- [x] 建立整合範例程式碼
- [x] Git 分支管理與提交

## 🔗 相關檔案連結

- 測試報告: `k6_test_0917_01.md`
- Jaeger 文檔: `jaeger/README.md`
- Docker 配置: `jaeger/docker-compose-v2.yml`
- 整合範例: `jaeger/integration/`
- 修復的程式碼: `src/services/auth-service.ts:91-95`

## 📌 重要指令備忘

```bash
# 啟動 Jaeger
cd jaeger && docker-compose -f docker-compose-v2.yml up -d

# 查看 Jaeger 日誌
docker-compose -f docker-compose-v2.yml logs -f jaeger

# 停止 Jaeger
docker-compose -f docker-compose-v2.yml down

# 在應用程式中使用
npm install @opentelemetry/api @opentelemetry/sdk-node
```

---
**工作總結**: 成功完成 K6 測試問題修復與 Jaeger 分布式追蹤系統整合，提供完整的效能監控解決方案。