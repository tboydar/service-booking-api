import { Context, Next } from 'koa';
import { LoggerService } from '../services/logger.service';

interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  apiCallsToday: number;
  errorsToday: number;
  averageResponseTime: number;
  requestsByHour: { [hour: string]: number };
  lastReset: Date;
}

class RequestStatsService {
  private stats: RequestStats;
  private responseTimes: number[] = [];
  private readonly maxResponseTimeHistory = 100;
  private logger: LoggerService;

  constructor() {
    this.logger = new LoggerService();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      apiCallsToday: 0,
      errorsToday: 0,
      averageResponseTime: 0,
      requestsByHour: {},
      lastReset: new Date()
    };

    // 每天重置當日統計
    this.scheduleDailyReset();
  }

  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilTomorrow = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetDailyStats();
      // 設定每24小時重置一次
      setInterval(() => this.resetDailyStats(), 24 * 60 * 60 * 1000);
    }, msUntilTomorrow);
  }

  private resetDailyStats(): void {
    this.stats.apiCallsToday = 0;
    this.stats.errorsToday = 0;
    this.stats.requestsByHour = {};
    this.stats.lastReset = new Date();
    this.logger.info('Daily request stats reset');
  }

  recordRequest(ctx: Context, responseTime: number): void {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, '0');
    const isSuccess = ctx.status >= 200 && ctx.status < 400;
    const isApiCall = ctx.path.startsWith('/api/') || ctx.path.startsWith('/services') || ctx.path.startsWith('/bookings');

    // 基本統計
    this.stats.totalRequests++;

    if (isApiCall) {
      this.stats.apiCallsToday++;
    }

    if (isSuccess) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
      if (isApiCall) {
        this.stats.errorsToday++;
      }
    }

    // 按小時統計
    this.stats.requestsByHour[hour] = (this.stats.requestsByHour[hour] || 0) + 1;

    // 響應時間統計
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }

    this.stats.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // 記錄慢請求
    if (responseTime > 1000) {
      this.logger.warn(`Slow request detected: ${ctx.method} ${ctx.path} - ${responseTime}ms`);
    }
  }

  getStats(): RequestStats {
    return { ...this.stats };
  }

  getHourlyData(): { hour: string; requests: number }[] {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      hours.push({
        hour: `${hour}:00`,
        requests: this.stats.requestsByHour[hour] || 0
      });
    }
    return hours;
  }

  getTodayStats(): { apiCalls: number; errors: number; successRate: number } {
    const successRate = this.stats.apiCallsToday > 0
      ? ((this.stats.apiCallsToday - this.stats.errorsToday) / this.stats.apiCallsToday * 100)
      : 100;

    return {
      apiCalls: this.stats.apiCallsToday,
      errors: this.stats.errorsToday,
      successRate: Math.round(successRate * 100) / 100
    };
  }
}

// 單例模式
export const requestStatsService = new RequestStatsService();

// Koa 中介軟體
export const requestStatsMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  const startTime = Date.now();

  try {
    await next();
  } catch (error) {
    // 確保錯誤也被記錄
    throw error;
  } finally {
    const responseTime = Date.now() - startTime;
    requestStatsService.recordRequest(ctx, responseTime);
  }
};

export default requestStatsService;