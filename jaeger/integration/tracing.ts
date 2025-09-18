/**
 * OpenTelemetry Tracing 初始化配置
 *
 * 此檔案設置 OpenTelemetry SDK 並配置追蹤資料導出到 Jaeger
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';

/**
 * 初始化 OpenTelemetry
 *
 * @param serviceName - 服務名稱，用於識別追蹤來源
 * @param environment - 環境標識 (development, staging, production)
 */
export function initializeTracing(
  serviceName: string = 'service-booking-api',
  environment: string = process.env.NODE_ENV || 'development'
): NodeSDK {
  // 設置異步上下文管理器，用於追蹤跨異步操作的上下文
  const contextManager = new AsyncHooksContextManager();
  contextManager.enable();
  context.setGlobalContextManager(contextManager);

  // 配置服務資源屬性
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
      // 添加自定義屬性
      'service.namespace': 'booking-system',
      'service.instance.id': process.env.HOSTNAME || 'local',
    })
  );

  // 配置 OTLP 追蹤導出器
  const traceExporter = new OTLPTraceExporter({
    // Jaeger OTLP HTTP 端點
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {
      // 可選：添加認證 header
      // 'Authorization': 'Bearer ' + process.env.JAEGER_AUTH_TOKEN
    },
    // 超時設定 (毫秒)
    timeoutMillis: 10000,
  });

  // 創建批次 Span 處理器
  const spanProcessor = new BatchSpanProcessor(traceExporter, {
    // 批次大小
    maxQueueSize: 2048,
    // 最大批次大小
    maxExportBatchSize: 512,
    // 批次超時 (毫秒)
    scheduledDelayMillis: 5000,
    // 導出超時 (毫秒)
    exportTimeoutMillis: 30000,
  });

  // 初始化 NodeSDK
  const sdk = new NodeSDK({
    resource,
    spanProcessor,
    // 自動儀表化配置
    instrumentations: [
      getNodeAutoInstrumentations({
        // 配置自動儀表化選項
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // 關閉檔案系統追蹤，避免過多雜訊
        },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          // 忽略健康檢查端點
          ignoreIncomingPaths: ['/health', '/metrics', '/favicon.ico'],
          // 忽略靜態資源
          ignoreOutgoingUrls: [/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/],
          // 添加自定義屬性
          requestHook: (span, request) => {
            span.setAttributes({
              'http.request.body.size': request.headers['content-length'] || 0,
              'http.user_agent': request.headers['user-agent'] || 'unknown',
            });
          },
          responseHook: (span, response) => {
            span.setAttributes({
              'http.response.body.size': response.headers['content-length'] || 0,
            });
          },
        },
        '@opentelemetry/instrumentation-koa': {
          enabled: true,
          // Koa 特定配置
          requestHook: (span, info) => {
            span.setAttributes({
              'koa.version': info.context.app.version || 'unknown',
              'koa.state': JSON.stringify(info.context.state),
            });
          },
        },
        '@opentelemetry/instrumentation-dns': {
          enabled: false, // 關閉 DNS 追蹤
        },
        '@opentelemetry/instrumentation-net': {
          enabled: false, // 關閉網路層追蹤
        },
      }),
    ],
  });

  // 優雅關閉處理
  const gracefulShutdown = async () => {
    try {
      await sdk.shutdown();
      console.log('Tracing terminated successfully');
    } catch (error) {
      console.error('Error shutting down tracing', error);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // 啟動 SDK
  sdk.start();

  console.log(`Tracing initialized for ${serviceName} in ${environment} environment`);
  console.log(`Sending traces to: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'}`);

  return sdk;
}

/**
 * 獲取當前的 Tracer 實例
 *
 * @param name - Tracer 名稱，通常使用模組名稱
 */
export function getTracer(name: string = 'default') {
  return trace.getTracer(name, '1.0.0');
}

/**
 * 創建自定義 Span 的輔助函數
 *
 * @param name - Span 名稱
 * @param fn - 要執行的異步函數
 * @param options - Span 選項
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  options?: {
    kind?: SpanKind;
    attributes?: Record<string, any>;
  }
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    kind: options?.kind || SpanKind.INTERNAL,
    attributes: options?.attributes,
  });

  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: any) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * 記錄事件到當前 Span
 *
 * @param name - 事件名稱
 * @param attributes - 事件屬性
 */
export function addEvent(name: string, attributes?: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * 設置當前 Span 的屬性
 *
 * @param attributes - 要設置的屬性
 */
export function setSpanAttributes(attributes: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * 取樣策略配置範例
 */
export const samplingConfig = {
  // 開發環境：100% 取樣
  development: 1.0,
  // 測試環境：50% 取樣
  test: 0.5,
  // 生產環境：10% 取樣
  production: 0.1,
};

/**
 * 獲取當前環境的取樣率
 */
export function getSamplingRate(): number {
  const env = process.env.NODE_ENV || 'development';
  const customRate = process.env.OTEL_TRACES_SAMPLER_ARG;

  if (customRate) {
    return parseFloat(customRate);
  }

  return samplingConfig[env as keyof typeof samplingConfig] || 1.0;
}

// 導出必要的 OpenTelemetry API
export { SpanStatusCode, SpanKind, context, trace };