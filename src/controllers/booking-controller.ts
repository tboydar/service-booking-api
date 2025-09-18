/**
 * 預約控制器（包含外部服務調用）
 * 用於展示服務依賴關係
 */

import { Context } from 'koa';
import axios from 'axios';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { ServiceRepository } from '../repositories/service.repository';

const tracer = trace.getTracer('booking-controller', '1.0.0');

export class BookingController {
  private serviceRepository: ServiceRepository;

  constructor() {
    this.serviceRepository = new ServiceRepository();
  }

  /**
   * 創建預約（包含支付）
   */
  async createBooking(ctx: Context): Promise<void> {
    const span = tracer.startSpan('booking.create_with_payment', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'controller': 'BookingController',
        'action': 'createBooking'
      }
    });

    try {
      const { serviceId, userId, date, time } = ctx.request.body as any;

      // 步驟1: 驗證服務
      const serviceSpan = tracer.startSpan('booking.verify_service', {
        kind: SpanKind.INTERNAL
      });

      const service = await this.serviceRepository.findById(serviceId);

      if (!service) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: 'Service not found'
        };
        serviceSpan.end();
        return;
      }

      serviceSpan.setAttributes({
        'service.id': serviceId,
        'service.name': service.name,
        'service.price': service.price
      });
      serviceSpan.end();

      // 步驟2: 調用外部支付服務
      const paymentSpan = tracer.startSpan('external.payment_service', {
        kind: SpanKind.CLIENT,
        attributes: {
          'http.method': 'POST',
          'http.url': 'http://localhost:3001/api/payment/process',
          'service.name': 'payment-service',
          'payment.amount': service.price
        }
      });

      try {
        const paymentResponse = await axios.post('http://localhost:3001/api/payment/process', {
          amount: service.price,
          serviceId: serviceId,
          userId: userId || 'guest'
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        paymentSpan.setStatus({ code: SpanStatusCode.OK });
        paymentSpan.setAttributes({
          'payment.success': true,
          'payment.transaction_id': paymentResponse.data.transactionId
        });

        // 步驟3: 創建預約記錄
        const bookingSpan = tracer.startSpan('booking.save_record', {
          kind: SpanKind.INTERNAL
        });

        const bookingId = `BOOK-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // 這裡應該保存到資料庫，但為了 demo 簡化
        bookingSpan.setAttributes({
          'booking.id': bookingId,
          'booking.service_id': serviceId,
          'booking.date': date,
          'booking.time': time
        });
        bookingSpan.end();

        ctx.body = {
          success: true,
          data: {
            bookingId,
            serviceId,
            serviceName: service.name,
            amount: service.price,
            transactionId: paymentResponse.data.transactionId,
            date,
            time,
            status: 'confirmed'
          }
        };

      } catch (paymentError: any) {
        paymentSpan.recordException(paymentError);
        paymentSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: paymentError.message
        });

        ctx.status = 400;
        ctx.body = {
          success: false,
          error: 'Payment failed',
          message: paymentError.response?.data?.error || paymentError.message
        };
      } finally {
        paymentSpan.end();
      }

    } catch (error: any) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
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
  }

  /**
   * 查詢預約狀態（包含支付狀態）
   */
  async getBookingStatus(ctx: Context): Promise<void> {
    const span = tracer.startSpan('booking.check_status', {
      kind: SpanKind.INTERNAL
    });

    try {
      const { bookingId } = ctx.params;
      const { transactionId } = ctx.query;

      // 如果有交易ID，查詢支付狀態
      if (transactionId) {
        const paymentStatusSpan = tracer.startSpan('external.payment_status_check', {
          kind: SpanKind.CLIENT,
          attributes: {
            'http.method': 'GET',
            'http.url': `http://localhost:3001/api/payment/status/${transactionId}`,
            'service.name': 'payment-service'
          }
        });

        try {
          const statusResponse = await axios.get(
            `http://localhost:3001/api/payment/status/${transactionId}`,
            { timeout: 3000 }
          );

          paymentStatusSpan.setStatus({ code: SpanStatusCode.OK });

          ctx.body = {
            success: true,
            data: {
              bookingId,
              paymentStatus: statusResponse.data.status,
              transactionId: statusResponse.data.transactionId,
              amount: statusResponse.data.amount
            }
          };

        } catch (error: any) {
          paymentStatusSpan.recordException(error);
          paymentStatusSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          });
          throw error;
        } finally {
          paymentStatusSpan.end();
        }
      } else {
        // 簡化的預約狀態
        ctx.body = {
          success: true,
          data: {
            bookingId,
            status: 'confirmed'
          }
        };
      }

    } catch (error: any) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
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
  }

  /**
   * 取消預約（包含退款）
   */
  async cancelBooking(ctx: Context): Promise<void> {
    const span = tracer.startSpan('booking.cancel_with_refund', {
      kind: SpanKind.INTERNAL
    });

    try {
      const { bookingId } = ctx.params;
      const { transactionId, amount } = ctx.request.body as any;

      // 調用退款服務
      if (transactionId) {
        const refundSpan = tracer.startSpan('external.payment_refund', {
          kind: SpanKind.CLIENT,
          attributes: {
            'http.method': 'POST',
            'http.url': 'http://localhost:3001/api/payment/refund',
            'service.name': 'payment-service'
          }
        });

        try {
          const refundResponse = await axios.post(
            'http://localhost:3001/api/payment/refund',
            { transactionId, amount },
            { timeout: 5000 }
          );

          refundSpan.setStatus({ code: SpanStatusCode.OK });

          ctx.body = {
            success: true,
            data: {
              bookingId,
              status: 'cancelled',
              refundId: refundResponse.data.refundId,
              refundAmount: amount
            }
          };

        } catch (error: any) {
          refundSpan.recordException(error);
          refundSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          });
          throw error;
        } finally {
          refundSpan.end();
        }
      } else {
        ctx.body = {
          success: true,
          data: {
            bookingId,
            status: 'cancelled'
          }
        };
      }

    } catch (error: any) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
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
  }
}