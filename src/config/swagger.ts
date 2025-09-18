import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI 配置
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Service Booking API',
      version: '1.0.0',
      description: '服務預約管理系統 API 文檔',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
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
          bearerFormat: 'JWT',
          description: '請輸入 JWT Token'
        }
      },
      schemas: {
        // 通用錯誤響應
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ERROR_CODE' },
                message: { type: 'string', example: '錯誤訊息' },
                details: { type: 'object' }
              }
            }
          }
        },
        // 成功響應
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        },
        // 用戶模型
        User: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        // 服務模型
        Service: {
          type: 'object',
          required: ['name', 'duration', 'price', 'maxCapacity', 'isActive'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            duration: { type: 'integer', minimum: 1 },
            price: { type: 'number', minimum: 0 },
            maxCapacity: { type: 'integer', minimum: 1 },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        // 登入請求
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@example.com'
            },
            password: {
              type: 'string',
              example: 'Admin123!'
            }
          }
        },
        // 註冊請求
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
            phone: { type: 'string' }
          }
        },
        // Token 響應
        TokenResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: '用戶認證相關 API'
      },
      {
        name: 'Services',
        description: '服務管理相關 API'
      },
      {
        name: 'Admin',
        description: '管理後台相關 API'
      },
      {
        name: 'Health',
        description: '系統健康檢查'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './src/controllers/*.ts',
    './src/controllers/**/*.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;