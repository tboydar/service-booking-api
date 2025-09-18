/**
 * 模擬外部支付服務
 * 用於展示 Jaeger 服務依賴關係
 */

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

const app = new Koa();
const router = new Router();
const PORT = 3001;

// 初始化追蹤（使用相同的 tracing 設定）
import './tracing';

// 設定服務名稱
process.env['OTEL_SERVICE_NAME'] = 'payment-service';
process.env['OTEL_RESOURCE_ATTRIBUTES'] = 'service.name=payment-service,service.version=1.0.0';

const tracer = trace.getTracer('payment-service', '1.0.0');

// Body parser
app.use(bodyParser());

// 追蹤中介軟體
app.use(async (ctx, next) => {
  const span = tracer.startSpan(`${ctx.method} ${ctx.path}`, {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': ctx.method,
      'http.url': ctx.url,
      'http.target': ctx.path,
      'service.name': 'payment-service'
    }
  });

  try {
    await next();
    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttributes({
      'http.status_code': ctx.status
    });
  } catch (error: any) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
});

// 健康檢查
router.get('/health', (ctx) => {
  ctx.body = { status: 'healthy', service: 'payment-service' };
});

// 付款處理端點
router.post('/api/payment/process', async (ctx) => {
  const span = tracer.startSpan('payment.process', {
    kind: SpanKind.INTERNAL
  });

  try {
    const { amount, serviceId, userId } = ctx.request.body as any;

    // 模擬付款處理時間
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    // 模擬付款驗證
    const verifySpan = tracer.startSpan('payment.verify', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'payment.amount': amount,
        'payment.service_id': serviceId,
        'payment.user_id': userId
      }
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    verifySpan.end();

    // 模擬與銀行通訊
    const bankSpan = tracer.startSpan('bank.transaction', {
      kind: SpanKind.CLIENT,
      attributes: {
        'bank.name': 'Mock Bank',
        'transaction.type': 'payment'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 150));
    bankSpan.end();

    const success = Math.random() > 0.1; // 90% 成功率

    if (success) {
      ctx.body = {
        success: true,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        amount,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Payment declined',
        code: 'PAYMENT_DECLINED'
      };
    }

    span.setAttributes({
      'payment.success': success,
      'payment.amount': amount
    });

  } finally {
    span.end();
  }
});

// 退款端點
router.post('/api/payment/refund', async (ctx) => {
  const span = tracer.startSpan('payment.refund', {
    kind: SpanKind.INTERNAL
  });

  try {
    const { transactionId, amount } = ctx.request.body as any;

    await new Promise(resolve => setTimeout(resolve, 100));

    ctx.body = {
      success: true,
      refundId: `REF-${Date.now()}`,
      originalTransaction: transactionId,
      amount,
      status: 'processed'
    };

  } finally {
    span.end();
  }
});

// 付款狀態查詢
router.get('/api/payment/status/:transactionId', async (ctx) => {
  const span = tracer.startSpan('payment.check_status', {
    kind: SpanKind.INTERNAL
  });

  try {
    await new Promise(resolve => setTimeout(resolve, 50));

    ctx.body = {
      transactionId: ctx.params['transactionId'],
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
});

export { app };