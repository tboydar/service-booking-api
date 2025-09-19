/**
 * 預約路由
 */

import Router from 'koa-router';
import { BookingController } from '../controllers/booking-controller';

const router = new Router({ prefix: '/booking' });
const bookingController = new BookingController();

// 創建預約（包含支付）
router.post('/create', (ctx: any) => bookingController.createBooking(ctx));

// 查詢預約狀態
router.get('/status/:bookingId', (ctx: any) => bookingController.getBookingStatus(ctx));

// 取消預約（包含退款）
router.post('/cancel/:bookingId', (ctx: any) => bookingController.cancelBooking(ctx));

export const bookingRoutes = router;