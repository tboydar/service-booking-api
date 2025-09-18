# NodeJS 服務預約系統 - 完整實作指南

## 📋 目錄
- [專案概述](#專案概述)
- [系統架構](#系統架構)
- [技術棧](#技術棧)
- [資料庫設計](#資料庫設計)
- [API 設計](#api-設計)
- [認證與授權](#認證與授權)
- [增強功能](#增強功能)
- [測試策略](#測試策略)
- [部署架構](#部署架構)
- [監控與追蹤](#監控與追蹤)

## 專案概述

這是一個基於 TypeScript + Koa 的服務預約管理後端系統，提供完整的會員認證和服務管理功能。

### 核心功能
- 會員註冊與登入（JWT 認證）
- 服務（Service）完整 CRUD 操作
- 權限保護與驗證
- 完整的錯誤處理機制
- 分散式追蹤與日誌系統

## 系統架構

### 整體架構圖

```mermaid
flowchart TB
    subgraph "客戶端層"
        Client["Web/Mobile Client"]
        Postman["Postman/API Test"]
    end

    subgraph "網關層"
        Nginx["Nginx/負載均衡"]
        RateLimit["Rate Limiter"]
    end

    subgraph "應用層"
        API["Koa API Server"]
        Swagger["Swagger UI"]
        Health["Health Check"]
    end

    subgraph "服務層"
        Auth["認證服務"]
        Service["業務服務"]
        Logger["日誌服務"]
    end

    subgraph "資料層"
        SQLite["SQLite DB"]
        Redis["Redis Cache"]
    end

    subgraph "監控層"
        Jaeger["Jaeger Tracing"]
        Prometheus["Prometheus"]
        Grafana["Grafana"]
    end

    Client --> Nginx
    Postman --> Nginx
    Nginx --> RateLimit
    RateLimit --> API
    API --> Swagger
    API --> Health
    API --> Auth
    API --> Service
    API --> Logger
    Auth --> SQLite
    Service --> SQLite
    Auth --> Redis
    Logger --> Jaeger
    API --> Prometheus
    Prometheus --> Grafana
```

### 分層架構設計

```mermaid
flowchart LR
    subgraph "表現層"
        Routes["Routes"]
        Middleware["Middleware"]
        Validators["Validators"]
    end

    subgraph "業務層"
        Controllers["Controllers"]
        Services["Services"]
    end

    subgraph "資料層"
        Repositories["Repositories"]
        Models["Models"]
        Migrations["Migrations"]
    end

    subgraph "基礎層"
        Utils["Utils"]
        Config["Config"]
        Database["Database"]
    end

    Routes --> Controllers
    Middleware --> Controllers
    Validators --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> Models
    Models --> Database
    Migrations --> Database
    Services --> Utils
    Controllers --> Config
```

## 技術棧

### 核心技術選型

```mermaid
mindmap
  root["NodeJS 服務系統"]
    ["後端框架"]
      ["Koa 2"]
      ["TypeScript"]
      ["koa-router"]
      ["koa-bodyparser"]
    ["資料庫"]
      ["SQLite (Dev)"]
      ["PostgreSQL (Prod)"]
      ["Sequelize ORM"]
      ["Redis Cache"]
    ["認證安全"]
      ["JWT"]
      ["bcrypt"]
      ["helmet"]
      ["cors"]
    ["驗證校驗"]
      ["Joi"]
      ["class-validator"]
    ["文檔測試"]
      ["swagger-jsdoc"]
      ["koa2-swagger-ui"]
      ["Jest"]
      ["K6"]
    ["監控日誌"]
      ["Pino"]
      ["Jaeger"]
      ["Prometheus"]
    ["部署"]
      ["Docker"]
      ["Docker Compose"]
      ["GitHub Actions"]
```

### 技術棧詳細說明

| 類別 | 技術 | 版本 | 用途 |
|------|------|------|------|
| 執行環境 | Node.js | 18+ | JavaScript 執行環境 |
| 語言 | TypeScript | 5.0+ | 類型安全開發 |
| 框架 | Koa | 2.14+ | Web 應用框架 |
| 資料庫 | SQLite | 3.40+ | 開發環境資料庫 |
| ORM | Sequelize | 6.35+ | 資料庫操作 |
| 快取 | Redis | 7.0+ | Session 與快取 |
| 認證 | jsonwebtoken | 9.0+ | JWT 生成與驗證 |
| 加密 | bcrypt | 5.1+ | 密碼雜湊 |
| 驗證 | Joi | 17.9+ | 請求資料驗證 |
| 文檔 | swagger-jsdoc | 6.2+ | API 文檔生成 |
| UI | koa2-swagger-ui | 5.0+ | Swagger UI |
| 測試 | Jest | 29.5+ | 單元/整合測試 |
| 壓測 | K6 | 0.45+ | 效能測試 |
| 日誌 | Pino | 8.14+ | 結構化日誌 |
| 追蹤 | Jaeger | 1.45+ | 分散式追蹤 |
| 容器 | Docker | 24.0+ | 容器化部署 |

## 資料庫設計

### ER 關係圖

```mermaid
erDiagram
    Users ||--o{ AppointmentServices : manages
    Users ||--o{ Sessions : has
    Users ||--o{ AuditLogs : generates

    Users {
        uuid id PK
        varchar email UK
        varchar password
        varchar name
        timestamp createdAt
        timestamp updatedAt
    }

    AppointmentServices {
        uuid id PK
        varchar name
        text description
        integer price
        integer showTime
        integer order
        boolean isRemove
        boolean isPublic
        uuid userId FK
        timestamp createdAt
        timestamp updatedAt
    }

    Sessions {
        uuid id PK
        uuid userId FK
        varchar token
        timestamp expiresAt
        timestamp createdAt
    }

    AuditLogs {
        uuid id PK
        uuid userId FK
        varchar action
        json payload
        varchar ipAddress
        timestamp createdAt
    }
```

### SQLite 實作方案

```typescript
// database/config.ts
export const sqliteConfig = {
  dialect: 'sqlite',
  storage: process.env.DB_PATH || './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// 與 PostgreSQL 的差異處理
export const databaseConfig = {
  development: sqliteConfig,
  test: {
    ...sqliteConfig,
    storage: ':memory:'
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS
  }
};
```

### Migration 策略

```mermaid
flowchart TD
    Start["開始 Migration"]
    Check{"檢查環境"}
    SQLite["SQLite Migration"]
    PostgreSQL["PostgreSQL Migration"]
    RunMigration["執行 Migration"]
    Seed["執行 Seed Data"]
    Complete["完成"]

    Start --> Check
    Check -->|Development| SQLite
    Check -->|Production| PostgreSQL
    SQLite --> RunMigration
    PostgreSQL --> RunMigration
    RunMigration --> Seed
    Seed --> Complete
```

## API 設計

### RESTful API 結構

```mermaid
flowchart TD
    subgraph "公開 API"
        GET_Services["GET /api/services"]
        GET_Service["GET /api/services/:id"]
        POST_Register["POST /api/auth/register"]
        POST_Login["POST /api/auth/login"]
        GET_Health["GET /health"]
        GET_Version["GET /version"]
    end

    subgraph "受保護 API"
        POST_Service["POST /api/services"]
        PUT_Service["PUT /api/services/:id"]
        DELETE_Service["DELETE /api/services/:id"]
        GET_Profile["GET /api/users/profile"]
        POST_Logout["POST /api/auth/logout"]
    end

    subgraph "管理 API"
        GET_Metrics["GET /metrics"]
        GET_Docs["GET /docs"]
    end

    JWT["JWT 驗證"]

    POST_Service --> JWT
    PUT_Service --> JWT
    DELETE_Service --> JWT
    GET_Profile --> JWT
    POST_Logout --> JWT
```

### API 端點詳細說明

| 方法 | 路徑 | 描述 | 認證 | 請求體 | 回應 |
|------|------|------|------|--------|------|
| **認證相關** |
| POST | /api/auth/register | 用戶註冊 | 否 | `{email, password, name}` | `{data: {user, token}}` |
| POST | /api/auth/login | 用戶登入 | 否 | `{email, password}` | `{data: {user, token}}` |
| POST | /api/auth/logout | 用戶登出 | 是 | - | `{data: {message}}` |
| POST | /api/auth/refresh | 刷新 Token | 是 | `{refreshToken}` | `{data: {token}}` |
| **服務管理** |
| GET | /api/services | 查詢服務列表 | 否 | - | `{data: services[]}` |
| GET | /api/services/:id | 查詢單一服務 | 否 | - | `{data: service}` |
| POST | /api/services | 新增服務 | 是 | `{name, description, price, showTime}` | `{data: service}` |
| PUT | /api/services/:id | 更新服務 | 是 | `{name, description, price, showTime}` | `{data: service}` |
| DELETE | /api/services/:id | 刪除服務 | 是 | - | `{data: {message}}` |
| **系統相關** |
| GET | /health | 健康檢查 | 否 | - | `{status, uptime, timestamp}` |
| GET | /version | 版本資訊 | 否 | - | `{version, build, env}` |
| GET | /metrics | Prometheus 指標 | 否 | - | Prometheus 格式 |
| GET | /docs | Swagger 文檔 | 否 | - | HTML |

## 認證與授權

### JWT 認證流程

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Server
    participant Auth as Auth Service
    participant DB as Database
    participant Redis as Redis Cache

    C->>API: POST /api/auth/login
    API->>Auth: 驗證憑證
    Auth->>DB: 查詢用戶
    DB-->>Auth: 用戶資料
    Auth->>Auth: 驗證密碼
    Auth->>Auth: 生成 JWT
    Auth->>Redis: 儲存 Session
    Auth-->>API: Token + User
    API-->>C: 200 {token, user}

    Note over C,API: 後續請求

    C->>API: GET /api/services (Bearer Token)
    API->>Auth: 驗證 Token
    Auth->>Redis: 檢查 Session
    Redis-->>Auth: Session 資料
    Auth-->>API: 用戶資訊
    API->>API: 執行業務邏輯
    API-->>C: 200 {data}
```

### 權限中介層設計

```mermaid
flowchart TD
    Request["HTTP Request"]
    RateLimit["Rate Limiter"]
    CORS["CORS Handler"]
    BodyParser["Body Parser"]
    RequestID["Request ID"]
    Logger["Request Logger"]
    JWTAuth["JWT Authentication"]
    Validator["Data Validator"]
    Controller["Controller"]
    ErrorHandler["Error Handler"]
    Response["HTTP Response"]

    Request --> RateLimit
    RateLimit -->|通過| CORS
    RateLimit -->|限制| ErrorHandler
    CORS --> BodyParser
    BodyParser --> RequestID
    RequestID --> Logger
    Logger --> JWTAuth
    JWTAuth -->|認證成功| Validator
    JWTAuth -->|認證失敗| ErrorHandler
    Validator -->|驗證成功| Controller
    Validator -->|驗證失敗| ErrorHandler
    Controller -->|成功| Response
    Controller -->|錯誤| ErrorHandler
    ErrorHandler --> Response
```

## 增強功能

### 1. K6 壓力測試配置

```javascript
// tests/k6/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // 漸進到 100 用戶
    { duration: '5m', target: 100 },  // 維持 100 用戶
    { duration: '2m', target: 200 },  // 增加到 200 用戶
    { duration: '5m', target: 200 },  // 維持 200 用戶
    { duration: '2m', target: 300 },  // 增加到 300 用戶
    { duration: '5m', target: 300 },  // 維持 300 用戶
    { duration: '10m', target: 0 },   // 漸進到 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% 請求在 500ms 內
    'errors': ['rate<0.01'],             // 錯誤率 < 1%
  },
};

export default function () {
  // 測試場景實作
  const BASE_URL = 'http://localhost:3000';

  // 1. 健康檢查
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
  });

  // 2. 登入測試
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const success = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).data.token !== undefined,
  });

  errorRate.add(!success);

  if (success) {
    const token = JSON.parse(loginRes.body).data.token;

    // 3. 查詢服務列表
    const servicesRes = http.get(
      `${BASE_URL}/api/services`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    check(servicesRes, {
      'services fetched': (r) => r.status === 200,
    });
  }

  sleep(1);
}
```

### 壓測場景圖

```mermaid
flowchart LR
    subgraph "K6 壓測場景"
        Start["開始測試"]
        Ramp1["漸進 100 用戶"]
        Steady1["維持 100 用戶"]
        Ramp2["漸進 200 用戶"]
        Steady2["維持 200 用戶"]
        Ramp3["漸進 300 用戶"]
        Steady3["維持 300 用戶"]
        RampDown["漸進降至 0"]
        Report["生成報告"]
    end

    Start --> Ramp1
    Ramp1 --> Steady1
    Steady1 --> Ramp2
    Ramp2 --> Steady2
    Steady2 --> Ramp3
    Ramp3 --> Steady3
    Steady3 --> RampDown
    RampDown --> Report
```

### 2. Swagger 文檔整合

```typescript
// swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { koaSwagger } from 'koa2-swagger-ui';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '服務預約系統 API',
      version: '1.0.0',
      description: '完整的服務預約管理系統 API 文檔',
      contact: {
        name: 'API Support',
        email: 'api@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '開發環境'
      },
      {
        url: 'https://api.example.com',
        description: '生產環境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'number' },
            detail: { type: 'string' },
            instance: { type: 'string' }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            showTime: { type: 'number' },
            order: { type: 'number' },
            isPublic: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const swaggerUI = koaSwagger({
  routePrefix: '/docs',
  swaggerOptions: {
    spec: swaggerSpec,
    docExpansion: 'none',
    persistAuthorization: true,
    tryItOutEnabled: true
  }
});
```

### 3. 健康檢查與版本資訊

```typescript
// health.controller.ts
export class HealthController {
  async healthCheck(ctx: Context) {
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        external: await this.checkExternalServices()
      },
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        unit: 'MB'
      }
    };

    ctx.body = healthInfo;
  }

  async versionInfo(ctx: Context) {
    ctx.body = {
      version: process.env.APP_VERSION || '1.0.0',
      build: process.env.BUILD_NUMBER || 'dev',
      commit: process.env.GIT_COMMIT || 'unknown',
      environment: process.env.NODE_ENV,
      node: process.version,
      dependencies: {
        koa: '2.14.2',
        sequelize: '6.35.1',
        typescript: '5.2.2'
      }
    };
  }
}
```

### 4. Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: service-booking-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - JAEGER_AGENT_HOST=jaeger
    depends_on:
      - postgres
      - redis
      - jaeger
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      - POSTGRES_DB=servicedb
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: redis
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - app-network

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    ports:
      - "16686:16686"
      - "14268:14268"
    networks:
      - app-network

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - app-network

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:
```

### Docker 架構圖

```mermaid
flowchart TB
    subgraph "Docker Compose Stack"
        subgraph "Application"
            App["Node.js App<br/>Port: 3000"]
        end

        subgraph "Database"
            Postgres["PostgreSQL<br/>Port: 5432"]
            Redis["Redis<br/>Port: 6379"]
        end

        subgraph "Monitoring"
            Jaeger["Jaeger<br/>Port: 16686"]
            Prometheus["Prometheus<br/>Port: 9090"]
            Grafana["Grafana<br/>Port: 3001"]
        end
    end

    App --> Postgres
    App --> Redis
    App --> Jaeger
    Prometheus --> App
    Grafana --> Prometheus

    External["External Access"] --> App
    External --> Jaeger
    External --> Grafana
```

### 5. RFC7807 錯誤處理

```typescript
// error-handler.ts
import { Context } from 'koa';

export interface RFC7807Error {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: any;
}

export class ErrorHandler {
  static formatError(error: any, ctx: Context): RFC7807Error {
    const timestamp = new Date().toISOString();
    const requestId = ctx.get('x-request-id');

    // 基礎錯誤結構
    const errorResponse: RFC7807Error = {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      instance: ctx.path,
      timestamp,
      requestId
    };

    // 根據錯誤類型調整
    if (error.name === 'ValidationError') {
      errorResponse.type = '/errors/validation';
      errorResponse.title = 'Validation Error';
      errorResponse.status = 400;
      errorResponse.detail = error.message;
      errorResponse.errors = error.errors;
    } else if (error.name === 'UnauthorizedError') {
      errorResponse.type = '/errors/unauthorized';
      errorResponse.title = 'Unauthorized';
      errorResponse.status = 401;
      errorResponse.detail = 'Authentication required';
    } else if (error.name === 'ForbiddenError') {
      errorResponse.type = '/errors/forbidden';
      errorResponse.title = 'Forbidden';
      errorResponse.status = 403;
      errorResponse.detail = 'Insufficient permissions';
    } else if (error.name === 'NotFoundError') {
      errorResponse.type = '/errors/not-found';
      errorResponse.title = 'Not Found';
      errorResponse.status = 404;
      errorResponse.detail = error.message || 'Resource not found';
    } else if (error.status) {
      errorResponse.status = error.status;
      errorResponse.title = error.message;
      errorResponse.detail = error.detail;
    }

    return errorResponse;
  }

  static middleware() {
    return async (ctx: Context, next: Function) => {
      try {
        await next();
      } catch (error: any) {
        const errorResponse = ErrorHandler.formatError(error, ctx);
        ctx.status = errorResponse.status;
        ctx.body = errorResponse;

        // 記錄錯誤
        ctx.app.emit('error', error, ctx);
      }
    };
  }
}
```

### 錯誤處理流程圖

```mermaid
flowchart TD
    Request["請求進入"]
    TryCatch["Try-Catch 包裹"]
    Execute["執行業務邏輯"]
    Success["成功回應"]
    CatchError["捕獲錯誤"]
    IdentifyType["識別錯誤類型"]

    Validation["驗證錯誤<br/>400"]
    Auth["認證錯誤<br/>401"]
    Permission["權限錯誤<br/>403"]
    NotFound["找不到資源<br/>404"]
    Server["伺服器錯誤<br/>500"]

    FormatRFC7807["格式化 RFC7807"]
    LogError["記錄錯誤"]
    SendResponse["發送錯誤回應"]

    Request --> TryCatch
    TryCatch --> Execute
    Execute -->|成功| Success
    Execute -->|失敗| CatchError
    CatchError --> IdentifyType

    IdentifyType --> Validation
    IdentifyType --> Auth
    IdentifyType --> Permission
    IdentifyType --> NotFound
    IdentifyType --> Server

    Validation --> FormatRFC7807
    Auth --> FormatRFC7807
    Permission --> FormatRFC7807
    NotFound --> FormatRFC7807
    Server --> FormatRFC7807

    FormatRFC7807 --> LogError
    LogError --> SendResponse
```

### 6. Pino 日誌與 Request ID

```typescript
// logger.ts
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { Context } from 'koa';

// Pino 配置
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      },
      {
        target: 'pino/file',
        options: {
          destination: './logs/app.log',
          mkdir: true
        }
      }
    ]
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: req.headers,
      remoteAddress: req.socket?.remoteAddress
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.headers
    })
  }
});

// Request ID 中介層
export const requestIdMiddleware = () => {
  return async (ctx: Context, next: Function) => {
    const requestId = ctx.get('x-request-id') || uuidv4();
    ctx.set('x-request-id', requestId);
    ctx.state.requestId = requestId;

    // 建立子日誌器
    ctx.logger = logger.child({ requestId });

    // 記錄請求
    ctx.logger.info({
      msg: 'Request received',
      method: ctx.method,
      path: ctx.path,
      query: ctx.query,
      ip: ctx.ip
    });

    const start = Date.now();

    try {
      await next();

      // 記錄回應
      const duration = Date.now() - start;
      ctx.logger.info({
        msg: 'Request completed',
        status: ctx.status,
        duration
      });
    } catch (error) {
      const duration = Date.now() - start;
      ctx.logger.error({
        msg: 'Request failed',
        error: error.message,
        stack: error.stack,
        duration
      });
      throw error;
    }
  };
};
```

### 7. Jaeger 分散式追蹤

```typescript
// tracing.ts
import { initTracer, TracingConfig, TracingOptions } from 'jaeger-client';
import { Context } from 'koa';

const config: TracingConfig = {
  serviceName: 'service-booking-api',
  reporter: {
    agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
    agentPort: Number(process.env.JAEGER_AGENT_PORT) || 6832,
    logSpans: true
  },
  sampler: {
    type: 'const',
    param: 1
  }
};

const options: TracingOptions = {
  logger: {
    info: (msg) => console.log('JAEGER INFO:', msg),
    error: (msg) => console.error('JAEGER ERROR:', msg)
  }
};

export const tracer = initTracer(config, options);

// Tracing 中介層
export const tracingMiddleware = () => {
  return async (ctx: Context, next: Function) => {
    const span = tracer.startSpan(`${ctx.method} ${ctx.path}`);

    // 設定標籤
    span.setTag('http.method', ctx.method);
    span.setTag('http.url', ctx.url);
    span.setTag('http.remote_addr', ctx.ip);
    span.setTag('request.id', ctx.state.requestId);

    ctx.state.span = span;

    try {
      await next();
      span.setTag('http.status_code', ctx.status);
    } catch (error) {
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      throw error;
    } finally {
      span.finish();
    }
  };
};

// 服務層追蹤範例
export function traceAsync(operationName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const parentSpan = args[0]?.state?.span;
      const span = tracer.startSpan(operationName, {
        childOf: parentSpan
      });

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        throw error;
      } finally {
        span.finish();
      }
    };

    return descriptor;
  };
}
```

### 追蹤架構圖

```mermaid
flowchart TD
    subgraph "應用程式"
        API["API Server"]
        Service["Service Layer"]
        Repository["Repository Layer"]
    end

    subgraph "追蹤系統"
        Agent["Jaeger Agent"]
        Collector["Jaeger Collector"]
        Storage["Trace Storage"]
        UI["Jaeger UI"]
    end

    API -->|Span| Agent
    Service -->|Span| Agent
    Repository -->|Span| Agent

    Agent --> Collector
    Collector --> Storage
    Storage --> UI

    User["開發者"] --> UI
```

## 測試策略

### 測試金字塔

```mermaid
flowchart TB
    subgraph "測試金字塔"
        E2E["E2E 測試<br/>5%"]
        Integration["整合測試<br/>25%"]
        Unit["單元測試<br/>70%"]
    end

    subgraph "測試工具"
        K6["K6 壓力測試"]
        Jest["Jest 測試框架"]
        Supertest["Supertest API 測試"]
    end

    E2E --> K6
    Integration --> Jest
    Integration --> Supertest
    Unit --> Jest
```

### 測試覆蓋率要求

| 測試類型 | 覆蓋率目標 | 測試重點 |
|---------|-----------|---------|
| 單元測試 | > 80% | 業務邏輯、工具函數、驗證器 |
| 整合測試 | > 60% | API 端點、資料庫操作、中介層 |
| E2E 測試 | 核心流程 | 註冊登入、CRUD 操作、錯誤處理 |

### K6 壓測場景

```mermaid
flowchart LR
    subgraph "壓測場景"
        Smoke["煙霧測試<br/>1 用戶"]
        Load["負載測試<br/>100 用戶"]
        Stress["壓力測試<br/>300 用戶"]
        Spike["尖峰測試<br/>1000 用戶"]
        Soak["浸泡測試<br/>24 小時"]
    end

    Smoke -->|通過| Load
    Load -->|通過| Stress
    Stress -->|通過| Spike
    Spike -->|通過| Soak
```

### 測試腳本範例

```typescript
// tests/services/auth.service.test.ts
describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = createMockRepository<UserRepository>();
    authService = new AuthService(userRepository);
  });

  describe('register', () => {
    it('should create new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        id: 'uuid',
        ...userData,
        password: 'hashed_password'
      });

      const result = await authService.register(userData);

      expect(result).toHaveProperty('token');
      expect(result.user).not.toHaveProperty('password');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          name: userData.name,
          password: expect.not.stringMatching(userData.password)
        })
      );
    });

    it('should throw error if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password',
          name: 'User'
        })
      ).rejects.toThrow('Email already registered');
    });
  });
});
```

## 部署架構

### CI/CD 流程

```mermaid
flowchart LR
    subgraph "開發"
        Dev["本地開發"]
        Test["本地測試"]
        Commit["Git Commit"]
    end

    subgraph "CI Pipeline"
        GH["GitHub Actions"]
        Lint["ESLint/Prettier"]
        UnitTest["單元測試"]
        IntTest["整合測試"]
        Build["Docker Build"]
        Scan["安全掃描"]
    end

    subgraph "CD Pipeline"
        Push["Push Image"]
        Deploy["部署"]
        HealthCheck["健康檢查"]
        Rollback["回滾機制"]
    end

    Dev --> Test
    Test --> Commit
    Commit --> GH
    GH --> Lint
    Lint --> UnitTest
    UnitTest --> IntTest
    IntTest --> Build
    Build --> Scan
    Scan --> Push
    Push --> Deploy
    Deploy --> HealthCheck
    HealthCheck -->|失敗| Rollback
```

### GitHub Actions 配置

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:test@localhost/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/service-booking-api:latest
            ${{ secrets.DOCKER_USERNAME }}/service-booking-api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # 實際部署指令
```

## 監控與追蹤

### 監控架構

```mermaid
flowchart TB
    subgraph "應用層"
        App1["API Server 1"]
        App2["API Server 2"]
        App3["API Server 3"]
    end

    subgraph "收集層"
        Metrics["Prometheus<br/>Metrics"]
        Logs["Pino<br/>Logs"]
        Traces["Jaeger<br/>Traces"]
    end

    subgraph "儲存層"
        TSDB["Time Series DB"]
        LogStore["Log Storage"]
        TraceStore["Trace Storage"]
    end

    subgraph "視覺化"
        Grafana["Grafana<br/>Dashboard"]
        Kibana["Kibana<br/>Log Analysis"]
        JaegerUI["Jaeger UI<br/>Trace Analysis"]
    end

    App1 --> Metrics
    App2 --> Metrics
    App3 --> Metrics

    App1 --> Logs
    App2 --> Logs
    App3 --> Logs

    App1 --> Traces
    App2 --> Traces
    App3 --> Traces

    Metrics --> TSDB
    Logs --> LogStore
    Traces --> TraceStore

    TSDB --> Grafana
    LogStore --> Kibana
    TraceStore --> JaegerUI
```

### Prometheus 指標配置

```typescript
// metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';
import { Context } from 'koa';

// 自定義指標
export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

export const databasePoolSize = new Gauge({
  name: 'database_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state']
});

// Metrics 中介層
export const metricsMiddleware = () => {
  return async (ctx: Context, next: Function) => {
    const start = Date.now();
    activeConnections.inc();

    try {
      await next();
    } finally {
      const duration = (Date.now() - start) / 1000;
      const labels = {
        method: ctx.method,
        path: ctx.path,
        status: ctx.status.toString()
      };

      httpRequestTotal.inc(labels);
      httpRequestDuration.observe(labels, duration);
      activeConnections.dec();
    }
  };
};

// Metrics 端點
export const metricsEndpoint = async (ctx: Context) => {
  ctx.set('Content-Type', register.contentType);
  ctx.body = await register.metrics();
};
```

### Grafana Dashboard 配置

```json
{
  "dashboard": {
    "title": "Service Booking API Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"4..|5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "active_connections"
          }
        ]
      }
    ]
  }
}
```

## 專案結構

```
service-booking-api/
├── src/
│   ├── config/           # 設定檔
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── swagger.ts
│   │   └── app.ts
│   ├── controllers/      # 控制器
│   │   ├── auth.controller.ts
│   │   ├── service.controller.ts
│   │   └── health.controller.ts
│   ├── services/         # 業務邏輯
│   │   ├── auth.service.ts
│   │   └── appointment.service.ts
│   ├── repositories/     # 資料存取
│   │   ├── user.repository.ts
│   │   └── service.repository.ts
│   ├── models/           # 資料模型
│   │   ├── user.model.ts
│   │   └── service.model.ts
│   ├── middlewares/      # 中介層
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── tracing.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/           # 路由
│   │   ├── auth.routes.ts
│   │   ├── service.routes.ts
│   │   └── index.ts
│   ├── utils/            # 工具函數
│   │   ├── logger.ts
│   │   ├── tracer.ts
│   │   └── validator.ts
│   ├── migrations/       # 資料庫遷移
│   ├── seeders/          # 種子資料
│   └── app.ts           # 應用程式入口
├── tests/               # 測試檔案
│   ├── unit/
│   ├── integration/
│   └── k6/
├── docker/              # Docker 相關
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/             # GitHub Actions
│   └── workflows/
├── docs/                # 文檔
├── logs/                # 日誌檔案
├── .env.example        # 環境變數範例
├── .eslintrc.js        # ESLint 設定
├── .prettierrc         # Prettier 設定
├── jest.config.js      # Jest 設定
├── tsconfig.json       # TypeScript 設定
├── package.json        # 專案設定
└── README.md          # 專案說明
```

## 快速開始指南

### 1. 環境準備

```bash
# 克隆專案
git clone https://github.com/yourusername/service-booking-api.git
cd service-booking-api

# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env
```

### 2. 資料庫設定

```bash
# 執行 migration
npm run db:migrate

# 執行種子資料
npm run db:seed
```

### 3. 啟動服務

```bash
# 開發模式
npm run dev

# 生產模式
npm run build
npm start

# Docker 啟動
docker-compose up
```

### 4. 訪問服務

- API 服務: http://localhost:3000
- Swagger 文檔: http://localhost:3000/docs
- 健康檢查: http://localhost:3000/health
- Prometheus 指標: http://localhost:3000/metrics
- Jaeger UI: http://localhost:16686
- Grafana: http://localhost:3001

### 5. 執行測試

```bash
# 單元測試
npm run test:unit

# 整合測試
npm run test:integration

# 覆蓋率報告
npm run test:coverage

# K6 壓力測試
npm run test:k6
```

## 總結

本專案實現了一個完整的服務預約管理系統，涵蓋：

✅ **核心功能**
- JWT 認證系統
- 服務 CRUD 操作
- 權限控制

✅ **增強功能**
- K6 壓力測試
- Swagger API 文檔
- Docker Compose 部署
- RFC7807 錯誤處理
- Pino 結構化日誌
- Jaeger 分散式追蹤
- Prometheus 監控

✅ **最佳實踐**
- 分層架構設計
- TypeScript 類型安全
- 完整測試覆蓋
- CI/CD 自動化
- 全面監控方案

本系統可作為生產環境的基礎架構，具有良好的擴展性和維護性。