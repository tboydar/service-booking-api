/**
 * OpenTelemetry Tracing 初始化配置
 *
 * 此檔案設置 OpenTelemetry SDK 並配置追蹤資料導出到 Jaeger
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import * as opentelemetry from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// 初始化 OpenTelemetry
console.log('Initializing OpenTelemetry tracing...');

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: {},
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // 關閉檔案系統追蹤
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingPaths: ['/health', '/metrics', '/favicon.ico'],
      },
    }),
  ],
});

// 啟動 SDK
try {
  sdk.start();
  console.log(`✅ OpenTelemetry tracing initialized for ${process.env.OTEL_SERVICE_NAME || 'service-booking-api'}`);
  console.log(`📡 Sending traces to: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'}`);
} catch (error) {
  console.error('❌ Error initializing OpenTelemetry tracing:', error);
}

// 優雅關閉處理
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated successfully'))
    .catch((error) => console.error('Error shutting down tracing', error))
    .finally(() => process.exit(0));
});

// 導出 API
export const trace = opentelemetry.trace;
export const context = opentelemetry.context;
export const SpanStatusCode = opentelemetry.SpanStatusCode;
export const SpanKind = opentelemetry.SpanKind;

/**
 * 獲取當前的 Tracer 實例
 */
export function getTracer(name: string = 'default') {
  return trace.getTracer(name, '1.0.0');
}

/**
 * 創建自定義 Span 的輔助函數
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  options?: {
    kind?: opentelemetry.SpanKind;
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
 */
export function addEvent(name: string, attributes?: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * 設置當前 Span 的屬性
 */
export function setSpanAttributes(attributes: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}