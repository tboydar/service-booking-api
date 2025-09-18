/**
 * 簡化版模擬支付服務 (JavaScript)
 * 用於展示 Jaeger 服務依賴關係
 */

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();
const PORT = 3001;

// 設定 OpenTelemetry 環境變數
process.env['OTEL_SERVICE_NAME'] = 'payment-service';
process.env['OTEL_RESOURCE_ATTRIBUTES'] = 'service.name=payment-service,service.version=1.0.0';
process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] = 'http://localhost:4318';

// 初始化 OpenTelemetry
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const opentelemetry = require('@opentelemetry/api');

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
});

const sdk = new NodeSDK({
  traceExporter,
  serviceName: 'payment-service',
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

sdk.start();
console.log('✅ Payment Service OpenTelemetry initialized');

const tracer = opentelemetry.trace.getTracer('payment-service', '1.0.0');

// Body parser
app.use(bodyParser());

// 請求追蹤中介軟體
app.use(async (ctx, next) => {
  const span = tracer.startSpan(`${ctx.method} ${ctx.path}`, {
    kind: opentelemetry.SpanKind.SERVER,
    attributes: {
      'http.method': ctx.method,
      'http.url': ctx.url,
      'http.target': ctx.path,
      'service.type': 'payment'
    }
  });

  try {
    await next();
    span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
    span.setAttributes({
      'http.status_code': ctx.status
    });
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: opentelemetry.SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
});

// 健康檢查
router.get('/health', (ctx) => {
  ctx.body = {
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString()
  };
});

// 付款處理端點
router.post('/api/payment/process', async (ctx) => {
  const span = tracer.startSpan('payment.process', {
    kind: opentelemetry.SpanKind.INTERNAL
  });

  try {
    const { amount, serviceId, userId } = ctx.request.body;

    // 模擬付款處理
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    // 模擬付款驗證
    const verifySpan = tracer.startSpan('payment.verify', {
      kind: opentelemetry.SpanKind.INTERNAL,
      attributes: {
        'payment.amount': amount,
        'payment.service_id': serviceId,
        'payment.user_id': userId || 'guest'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    verifySpan.end();

    // 模擬與銀行通訊
    const bankSpan = tracer.startSpan('bank.transaction', {
      kind: opentelemetry.SpanKind.CLIENT,
      attributes: {
        'bank.name': 'Mock Bank API',
        'transaction.type': 'payment'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 150));
    bankSpan.end();

    const success = Math.random() > 0.1; // 90% 成功率

    if (success) {
      span.setAttributes({
        'payment.success': true,
        'payment.amount': amount
      });

      ctx.body = {
        success: true,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        amount,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
    } else {
      span.setAttributes({
        'payment.success': false,
        'payment.error': 'PAYMENT_DECLINED'
      });

      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Payment declined',
        code: 'PAYMENT_DECLINED'
      };
    }

  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: opentelemetry.SpanStatusCode.ERROR,
      message: error.message
    });

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  } finally {
    span.end();
  }
});

// 退款端點
router.post('/api/payment/refund', async (ctx) => {
  const span = tracer.startSpan('payment.refund', {
    kind: opentelemetry.SpanKind.INTERNAL
  });

  try {
    const { transactionId, amount } = ctx.request.body;

    // 模擬退款處理
    await new Promise(resolve => setTimeout(resolve, 100));

    span.setAttributes({
      'refund.transaction_id': transactionId,
      'refund.amount': amount
    });

    ctx.body = {
      success: true,
      refundId: `REF-${Date.now()}`,
      originalTransaction: transactionId,
      amount,
      status: 'processed',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    span.recordException(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  } finally {
    span.end();
  }
});

// 付款狀態查詢
router.get('/api/payment/status/:transactionId', async (ctx) => {
  const span = tracer.startSpan('payment.check_status', {
    kind: opentelemetry.SpanKind.INTERNAL
  });

  try {
    await new Promise(resolve => setTimeout(resolve, 50));

    span.setAttributes({
      'status.transaction_id': ctx.params.transactionId
    });

    ctx.body = {
      transactionId: ctx.params.transactionId,
      status: 'completed',
      amount: 1000,
      timestamp: new Date().toISOString()
    };

  } finally {
    span.end();
  }
});

app.use(router.routes()).use(router.allowedMethods());

// 啟動服務
app.listen(PORT, () => {
  console.log(`💳 Mock Payment Service running on http://localhost:${PORT}`);
  console.log(`📡 Sending traces to Jaeger as 'payment-service'`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/payment/process`);
  console.log(`   POST /api/payment/refund`);
  console.log(`   GET  /api/payment/status/:id`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error shutting down tracing', error))
    .finally(() => process.exit(0));
});