import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './environment';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Service Booking API',
      version: '1.0.0',
      description: `
# 🎯 Service Booking API - 服務預約管理系統

一個基於 **TypeScript + Node.js + Koa + SQLite** 的現代化服務預約管理後端 API 系統

## 功能特色

- 🔐 **JWT 認證系統** - 安全的用戶認證和授權
- 👥 **會員管理** - 用戶註冊、登入、個人資料管理
- 🏪 **服務管理** - 服務創建、更新、查詢和刪除
- 📱 **RESTful API** - 標準化的 API 設計
- 🔍 **輸入驗證** - 完整的資料驗證和錯誤處理
- 📊 **健康檢查** - 系統狀態監控

## 認證說明

大部分 API 端點需要 JWT Token 認證。在請求標頭中加入：
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

可以通過 \`/auth/login\` 端點獲取 Token。
      `,
      contact: {
        name: 'API Support',
        email: 'support@service-booking-api.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT || 3000}`,
        description: '開發環境',
      },
      {
        url: 'https://api.service-booking.com',
        description: '生產環境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '用戶唯一識別碼',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              description: '用戶電子郵件',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              description: '用戶姓名',
              example: '張三',
              minLength: 2,
              maxLength: 50,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '創建時間',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新時間',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        Service: {
          type: 'object',
          required: ['id', 'name', 'price', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '服務唯一識別碼',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            name: {
              type: 'string',
              description: '服務名稱',
              example: '網站開發服務',
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: 'string',
              description: '服務描述',
              example: '提供專業的網站開發服務，包含前端和後端開發',
              maxLength: 1000,
            },
            price: {
              type: 'integer',
              description: '服務價格（新台幣）',
              example: 50000,
              minimum: 0,
            },
            showTime: {
              type: 'integer',
              description: '服務展示時間（分鐘）',
              example: 60,
              minimum: 0,
            },
            order: {
              type: 'integer',
              description: '排序順序',
              example: 1,
              minimum: 0,
            },
            isPublic: {
              type: 'boolean',
              description: '是否公開顯示',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '創建時間',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新時間',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          required: ['success', 'timestamp'],
          properties: {
            success: {
              type: 'boolean',
              description: '請求是否成功',
              example: true,
            },
            data: {
              description: '回應資料',
            },
            message: {
              type: 'string',
              description: '回應訊息',
              example: '操作成功',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '回應時間戳',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error', 'timestamp'],
          properties: {
            success: {
              type: 'boolean',
              description: '請求是否成功',
              example: false,
            },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'string',
                  description: '錯誤代碼',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  description: '錯誤訊息',
                  example: '輸入資料驗證失敗',
                },
                details: {
                  type: 'array',
                  description: '詳細錯誤資訊',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        description: '欄位名稱',
                        example: 'email',
                      },
                      message: {
                        type: 'string',
                        description: '欄位錯誤訊息',
                        example: '請輸入有效的電子郵件',
                      },
                    },
                  },
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '錯誤時間戳',
              example: '2024-01-01T00:00:00.000Z',
            },
            path: {
              type: 'string',
              description: '請求路徑',
              example: '/auth/register',
            },
          },
        },
        AuthRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: '用戶電子郵件',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              description: '用戶密碼',
              example: 'password123',
              minLength: 6,
            },
          },
        },
        RegisterRequest: {
          allOf: [
            { $ref: '#/components/schemas/AuthRequest' },
            {
              type: 'object',
              required: ['name'],
              properties: {
                name: {
                  type: 'string',
                  description: '用戶姓名',
                  example: '張三',
                  minLength: 2,
                  maxLength: 50,
                },
              },
            },
          ],
        },
        AuthResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  required: ['token', 'user'],
                  properties: {
                    token: {
                      type: 'string',
                      description: 'JWT Token',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                    user: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          ],
        },
        CreateServiceRequest: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: {
              type: 'string',
              description: '服務名稱',
              example: '網站開發服務',
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: 'string',
              description: '服務描述',
              example: '提供專業的網站開發服務',
              maxLength: 1000,
            },
            price: {
              type: 'integer',
              description: '服務價格（新台幣）',
              example: 50000,
              minimum: 0,
            },
            showTime: {
              type: 'integer',
              description: '服務展示時間（分鐘）',
              example: 60,
              minimum: 0,
            },
            order: {
              type: 'integer',
              description: '排序順序',
              example: 1,
              minimum: 0,
            },
            isPublic: {
              type: 'boolean',
              description: '是否公開顯示',
              example: true,
              default: true,
            },
          },
        },
        UpdateServiceRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '服務名稱',
              example: '網站開發服務',
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: 'string',
              description: '服務描述',
              example: '提供專業的網站開發服務',
              maxLength: 1000,
            },
            price: {
              type: 'integer',
              description: '服務價格（新台幣）',
              example: 50000,
              minimum: 0,
            },
            showTime: {
              type: 'integer',
              description: '服務展示時間（分鐘）',
              example: 60,
              minimum: 0,
            },
            order: {
              type: 'integer',
              description: '排序順序',
              example: 1,
              minimum: 0,
            },
            isPublic: {
              type: 'boolean',
              description: '是否公開顯示',
              example: true,
            },
          },
          minProperties: 1,
        },
        HealthResponse: {
          type: 'object',
          required: ['status', 'timestamp', 'uptime'],
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              description: '系統狀態',
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '檢查時間',
              example: '2024-01-01T00:00:00.000Z',
            },
            uptime: {
              type: 'number',
              description: '系統運行時間（秒）',
              example: 3600,
            },
            database: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['connected', 'disconnected'],
                  description: '資料庫連線狀態',
                  example: 'connected',
                },
                responseTime: {
                  type: 'number',
                  description: '資料庫回應時間（毫秒）',
                  example: 15,
                },
              },
            },
            version: {
              type: 'string',
              description: 'API 版本',
              example: '1.0.0',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // 路由檔案
    './src/controllers/*.ts', // 控制器檔案
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    syntaxHighlight: {
      theme: 'arta',
    },
    tryItOutEnabled: true,
  },
};