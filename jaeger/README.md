# Jaeger 分布式追蹤系統

## 📋 概述

Jaeger 是一個開源的分布式追蹤系統，用於監控和診斷微服務架構中的效能問題。本配置使用簡化的單容器部署方案，採用 BadgerDB 作為本地檔案儲存，無需外部依賴。

## 🚀 快速開始

### 1. 啟動 Jaeger

```bash
# 進入 jaeger 目錄
cd jaeger

# 使用 docker compose 啟動 (Docker Compose V2)
docker compose -f docker-compose-v2.yml up -d

# 檢查服務狀態
docker compose -f docker-compose-v2.yml ps
```

### 2. 訪問 Jaeger UI

開啟瀏覽器訪問: http://localhost:16686

### 3. 驗證服務依賴關係 (Demo)

#### 啟動測試服務
```bash
# 啟動主服務
npm run dev

# 啟動模擬支付服務 (另一個終端)
node payment-service.js
```

#### 產生追蹤數據
```bash
# 創建測試服務和預約
curl -X POST http://localhost:3000/booking/create \
  -H "Content-Type: application/json" \
  -d '{"serviceId": "test-service-001", "userId": "demo-user", "date": "2025-09-20", "time": "14:00"}'
```

#### 查看結果
- **服務列表**: http://localhost:16686/search
- **依賴關係圖**: http://localhost:16686/dependencies
- **追蹤詳情**: 選擇任一 trace 查看完整調用鏈

### 4. 停止服務

```bash
docker compose -f docker-compose-v2.yml down
```

## 🏗️ 系統架構

```
┌─────────────────┐     OpenTelemetry      ┌────────────────┐
│                 │     Protocol (OTLP)     │                │
│  Your App       ├────────────────────────>│    Jaeger      │
│  (Node.js/Koa)  │         :4318           │   Collector    │
│                 │                          │                │
└─────────────────┘                          └───────┬────────┘
                                                      │
                                                      ▼
                                             ┌────────────────┐
                                             │   BadgerDB     │
                                             │ (Local Storage)│
                                             └────────────────┘
                                                      │
                                                      ▼
                                             ┌────────────────┐
                                             │  Jaeger UI     │
                                             │    :16686      │
                                             └────────────────┘
```

## 💾 儲存方案說明

### BadgerDB 特點

- **嵌入式資料庫**: 類似 SQLite，無需額外的資料庫服務
- **本地檔案儲存**: 資料儲存在 `./data` 目錄
- **自動壓縮**: 內建資料壓縮功能
- **高效能**: LSM tree 架構，寫入效能優秀
- **資料持久化**: 容器重啟後資料保留

### 資料目錄結構

```
jaeger/data/
├── key/      # 索引資料
└── value/    # 追蹤資料
```

## 📊 預期效益

### 1. 效能分析 🚀
- **識別慢查詢**: 快速找出資料庫查詢瓶頸
- **API 延遲分析**: 分析每個 API 端點的響應時間
- **資源使用監控**: 了解系統資源使用情況

### 2. 故障診斷 🔍
- **錯誤追蹤**: 追蹤錯誤發生的完整路徑
- **根因分析**: 快速定位問題根源
- **減少 MTTR**: 平均修復時間從小時縮短到分鐘

### 3. 系統理解 📈
- **服務依賴圖**: 視覺化服務間的調用關係
- **請求流程圖**: 了解請求在系統中的完整流程
- **效能趨勢**: 長期效能資料分析

### 4. 開發效率提升 ⚡
- **減少除錯時間**: 50-70% 的除錯時間節省
- **主動發現問題**: 在用戶報告前發現效能問題
- **優化決策支援**: 基於資料的效能優化決策

## 🔧 應用程式整合

### 安裝必要套件

```bash
npm install --save \
  @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http
```

### 基本整合範例

參考 `integration/` 目錄中的範例程式碼：

1. **tracing.ts** - OpenTelemetry SDK 初始化
2. **middleware.ts** - Koa 中介軟體整合

### 環境變數配置

```env
# Jaeger 端點配置
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=service-booking-api
OTEL_TRACES_EXPORTER=otlp

# 取樣率設定 (0.0 - 1.0)
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1  # 10% 取樣率
```

## 🌐 遠端部署指南

### 在遠端伺服器部署

1. **複製配置檔案**
```bash
scp -r jaeger/ user@remote-server:/path/to/deployment/
```

2. **在遠端啟動服務**
```bash
ssh user@remote-server
cd /path/to/deployment/jaeger
docker-compose -f docker-compose-v2.yml up -d
```

3. **配置防火牆** (如需要)
```bash
# 開放 Jaeger UI 端口
sudo ufw allow 16686/tcp

# 開放 OTLP 端口 (用於接收追蹤資料)
sudo ufw allow 4318/tcp
```

### 從本地連接到遠端 Jaeger

修改環境變數指向遠端服務器：

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://remote-server-ip:4318
```

## 📝 配置說明

### 端口說明

| 端口 | 協議 | 用途 |
|------|------|------|
| 16686 | HTTP | Jaeger UI Web 介面 |
| 4317 | gRPC | OpenTelemetry Protocol (OTLP) |
| 4318 | HTTP | OpenTelemetry Protocol (OTLP) |
| 14268 | HTTP | Jaeger Collector HTTP |
| 14250 | gRPC | Jaeger Collector gRPC |
| 6831 | UDP | Jaeger Agent Compact Thrift |
| 6832 | UDP | Jaeger Agent Binary Thrift |
| 9411 | HTTP | Zipkin 相容端口 |

### 資料保留策略

預設設定：
- **資料保留時間**: 7 天 (168 小時)
- **垃圾回收間隔**: 1 小時
- **壓縮策略**: 自動壓縮老舊資料

修改保留時間：
```yaml
environment:
  - BADGER_SPAN_STORE_TTL=168h  # 修改此值調整保留時間
```

## ⚙️ 進階配置

### 資源限制調整

編輯 `docker-compose-v2.yml` 中的資源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # 增加 CPU 限制
      memory: 2G     # 增加記憶體限制
```

### 使用 Docker Volume (可選)

如果偏好使用 Docker 管理的卷而非本地目錄：

```yaml
volumes:
  - jaeger-badger-key:/badger/key
  - jaeger-badger-data:/badger/data

# 在檔案底部加入
volumes:
  jaeger-badger-key:
  jaeger-badger-data:
```

### 生產環境建議

1. **取樣策略**
   - 開發環境: 100% (1.0)
   - 測試環境: 50% (0.5)
   - 生產環境: 10% (0.1) 或更低

2. **資源配置**
   - 根據流量調整記憶體和 CPU 限制
   - 監控磁碟使用量，適時清理舊資料

3. **備份策略**
   - 定期備份 `./data` 目錄
   - 使用 rsync 或其他工具同步資料

## 🔍 故障排除

### 常見問題

1. **容器無法啟動**
   - 檢查端口是否被佔用: `lsof -i :16686`
   - 確認 Docker 服務正在運行: `docker info`

2. **資料未持久化**
   - 確認 `BADGER_EPHEMERAL=false`
   - 檢查目錄權限: `ls -la ./data`

3. **無法接收追蹤資料**
   - 確認應用程式配置的端點正確
   - 檢查防火牆規則
   - 查看容器日誌: `docker-compose logs jaeger`

### 日誌查看

```bash
# 查看即時日誌
docker-compose -f docker-compose-v2.yml logs -f jaeger

# 查看最近 100 行日誌
docker-compose -f docker-compose-v2.yml logs --tail=100 jaeger
```

## 📚 參考資源

- [Jaeger 官方文檔](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/languages/js/)
- [BadgerDB 文檔](https://dgraph.io/docs/badger/)
- [Docker Compose 文檔](https://docs.docker.com/compose/)

## 📄 授權

本配置遵循 MIT 授權條款。