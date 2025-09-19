/**
 * Koa 中介軟體整合範例
 *
 * 展示如何在 Koa 應用程式中整合 OpenTelemetry 追蹤
 */

import { Context, Next } from 'koa';
import { trace, SpanKind, SpanStatusCode, context } from '@opentelemetry/api';
import { getTracer, withSpan, setSpanAttributes, addEvent } from '../tracing';

/**
 * 自定義追蹤中介軟體
 *
 * 為每個請求創建 root span，並添加相關屬性
 */
export function tracingMiddleware() {
  const tracer = getTracer('koa-middleware');

  return async (ctx: Context, next: Next) => {
    const span = tracer.startSpan(`${ctx.method} ${ctx.path}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': ctx.method,
        'http.url': ctx.url,
        'http.target': ctx.path,
        'http.host': ctx.host,
        'http.scheme': ctx.protocol,
        'http.user_agent': ctx.headers['user-agent'] || 'unknown',
        'http.remote_addr': ctx.ip,
        'request.id': ctx.headers['x-request-id'] || generateRequestId(),
      },
    });

    // 將 span 添加到 context 中，方便後續使用
    ctx['state']['span'] = span;
    ctx['state']['requestId'] = span.spanContext().traceId;

    try {
      // 在 span 上下文中執行後續中介軟體
      await context.with(trace.setSpan(context.active(), span), async () => {
        await next();
      });

      // 設置響應狀態
      span.setAttributes({
        'http.status_code': ctx.status,
        'http.response.size': ctx.response.length || 0,
      });

      // 根據 HTTP 狀態碼設置 span 狀態
      if (ctx.status >= 400 && ctx.status < 500) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${ctx.status} Client Error`,
        });
      } else if (ctx.status >= 500) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${ctx.status} Server Error`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
    } catch (error: any) {
      // 記錄錯誤
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.setAttributes({
        'http.status_code': ctx.status || 500,
        'error.type': error.constructor.name,
        'error.message': error.message,
        'error.stack': error.stack,
      });
      throw error;
    } finally {
      // 結束 span
      span.end();
    }
  };
}

/**
 * 資料庫查詢追蹤中介軟體範例
 *
 * 為資料庫操作添加追蹤
 */
export function databaseTracingMiddleware() {
  return async (ctx: Context, next: Next) => {
    // 包裝資料庫查詢函數
    if (ctx['state']['db']) {
      const originalQuery = ctx['state']['db'].query;
      ctx['state']['db'].query = async (sql: string, params?: any[]) => {
        return await withSpan(
          'db.query',
          async () => originalQuery(sql, params),
          {
            kind: SpanKind.CLIENT,
            attributes: {
              'db.system': 'sqlite',
              'db.statement': sql.substring(0, 100), // 截斷長查詢
              'db.operation': sql.split(' ')[0]?.toUpperCase() || 'UNKNOWN',
              'db.params.count': params?.length || 0,
            },
          }
        );
      };
    }
    await next();
  };
}

/**
 * 效能監控中介軟體
 *
 * 追蹤請求處理時間並設置效能相關屬性
 */
export function performanceTracingMiddleware() {
  return async (ctx: Context, next: Next) => {
    const startTime = Date.now();
    const startCpu = process.cpuUsage();

    await next();

    const duration = Date.now() - startTime;
    const endCpu = process.cpuUsage(startCpu);
    const endMem = process.memoryUsage();

    // 如果存在活動 span，添加效能屬性
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttributes({
        'performance.duration_ms': duration,
        'performance.cpu.user': endCpu.user,
        'performance.cpu.system': endCpu.system,
        'performance.memory.rss': endMem.rss,
        'performance.memory.heap_used': endMem.heapUsed,
        'performance.memory.heap_total': endMem.heapTotal,
      });

      // 如果響應時間過長，添加警告事件
      if (duration > 1000) {
        addEvent('slow_request_warning', {
          duration_ms: duration,
          threshold_ms: 1000,
        });
      }
    }

    // 在響應頭中添加追蹤資訊
    if (ctx['state']['requestId']) {
      ctx.set('X-Request-ID', ctx['state']['requestId']);
      ctx.set('X-Response-Time', `${duration}ms`);
    }
  };
}

/**
 * 用戶身份追蹤中介軟體
 *
 * 為已認證的請求添加用戶資訊
 */
export function userTracingMiddleware() {
  return async (ctx: Context, next: Next) => {
    await next();

    // 如果用戶已認證，添加用戶屬性
    if (ctx['state']['user']) {
      const span = trace.getActiveSpan();
      if (span) {
        span.setAttributes({
          'user.id': ctx['state']['user'].id,
          'user.email': ctx['state']['user'].email,
          'user.role': ctx['state']['user'].role || 'user',
        });
      }
    }
  };
}

/**
 * 業務邏輯追蹤範例
 *
 * 展示如何在業務邏輯中添加自定義追蹤
 */
export async function tracedBusinessLogic(ctx: Context) {
  // 範例：追蹤服務預約流程
  return await withSpan('booking.create', async () => {
    // 步驟 1: 驗證用戶
    await withSpan('booking.validate_user', async () => {
      addEvent('user_validation_started');
      // 驗證邏輯...
      setSpanAttributes({
        'user.verified': true,
        'user.credit_score': 750,
      });
      addEvent('user_validation_completed');
    });

    // 步驟 2: 檢查服務可用性
    const availability = await withSpan(
      'booking.check_availability',
      async () => {
        // 檢查邏輯...
        return { available: true, slots: 5 };
      },
      {
        attributes: {
          'service.id': ctx['params'].serviceId,
          'booking.date': (ctx.request.body as any).date,
        },
      }
    );

    // 步驟 3: 創建預約
    if (availability.available) {
      return await withSpan('booking.create_record', async () => {
        // 創建預約記錄...
        addEvent('booking_created', {
          booking_id: 'BOOK-123456',
          service_id: ctx['params'].serviceId,
        });
        return { success: true, bookingId: 'BOOK-123456' };
      });
    }

    throw new Error('Service not available');
  });
}

/**
 * 錯誤追蹤中介軟體
 *
 * 捕獲並記錄應用程式錯誤
 */
export function errorTracingMiddleware() {
  return async (_ctx: Context, next: Next) => {
    try {
      await next();
    } catch (error: any) {
      const span = trace.getActiveSpan();
      if (span) {
        // 記錄錯誤詳情
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });

        // 添加錯誤相關屬性
        span.setAttributes({
          'error.type': error.constructor.name,
          'error.message': error.message,
          'error.code': error.code || 'UNKNOWN',
          'error.statusCode': error.statusCode || 500,
        });

        // 記錄錯誤事件
        addEvent('error_occurred', {
          error_type: error.constructor.name,
          error_message: error.message,
          stack_trace: error.stack?.substring(0, 500), // 截斷堆疊追蹤
        });
      }

      // 重新拋出錯誤，讓 Koa 的錯誤處理繼續
      throw error;
    }
  };
}

/**
 * API 端點範例：整合追蹤的控制器
 */
export class TracedController {
  /**
   * 獲取服務列表（帶追蹤）
   */
  async getServices(ctx: Context) {
    return await withSpan('controller.get_services', async () => {
      // 添加查詢參數屬性
      setSpanAttributes({
        'query.page': ctx['query']['page'] || 1,
        'query.limit': ctx['query']['limit'] || 10,
        'query.filter': ctx['query']['filter'] || 'none',
      });

      // 模擬資料庫查詢
      const services = await withSpan('db.find_services', async () => {
        // 資料庫查詢邏輯...
        return [
          { id: 1, name: 'Service 1', price: 100 },
          { id: 2, name: 'Service 2', price: 200 },
        ];
      });

      // 記錄結果
      addEvent('services_fetched', {
        count: services.length,
      });

      ctx.body = {
        success: true,
        data: services,
        requestId: ctx['state']['requestId'],
      };
    });
  }

  /**
   * 創建服務預約（帶追蹤）
   */
  async createBooking(ctx: Context) {
    return await withSpan(
      'controller.create_booking',
      async () => {
        const bookingData = ctx.request.body as any;

        // 添加預約資料屬性
        setSpanAttributes({
          'booking.service_id': bookingData.serviceId,
          'booking.date': bookingData.date,
          'booking.time': bookingData.time,
          'booking.customer_id': ctx['state']['user']?.id,
        });

        // 執行業務邏輯
        const result = await tracedBusinessLogic(ctx);

        ctx.body = result;
      },
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'operation': 'create_booking',
          'resource': 'booking',
        },
      }
    );
  }
}

/**
 * 生成請求 ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * 整合範例：在 Koa 應用程式中使用所有中介軟體
 *
 * @example
 * ```typescript
 * import Koa from 'koa';
 * import { initializeTracing } from './tracing';
 * import {
 *   tracingMiddleware,
 *   performanceTracingMiddleware,
 *   userTracingMiddleware,
 *   errorTracingMiddleware,
 *   databaseTracingMiddleware,
 * } from './middleware';
 *
 * // 初始化追蹤
 * initializeTracing('service-booking-api', 'production');
 *
 * const app = new Koa();
 *
 * // 應用中介軟體（順序很重要）
 * app.use(errorTracingMiddleware());
 * app.use(tracingMiddleware());
 * app.use(performanceTracingMiddleware());
 * app.use(userTracingMiddleware());
 * app.use(databaseTracingMiddleware());
 *
 * // 其他中介軟體和路由...
 *
 * app.listen(3000, () => {
 *   console.log('Server running with OpenTelemetry tracing enabled');
 * });
 * ```
 */