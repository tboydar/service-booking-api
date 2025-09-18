import { Context } from 'koa';
import { generateJWT } from '../middlewares/jwt-auth';
import { validatePassword } from '../utils/password';
import { SystemService } from '../services/system.service';
import { LoggerService } from '../services/logger.service';
import { SchedulerService } from '../services/scheduler.service';
import { requestStatsService } from '../middlewares/request-stats';
import { UserRepository } from '../repositories/user.repository';
import { ServiceRepository } from '../repositories/service.repository';

export class AdminController {
  private userRepository: UserRepository;
  private serviceRepository: ServiceRepository;

  constructor(
    private systemService: SystemService,
    private loggerService: LoggerService,
    private schedulerService: SchedulerService
  ) {
    this.userRepository = new UserRepository();
    this.serviceRepository = new ServiceRepository();
  }

  private formatLogMessageToActivity(message: string): string {
    // Convert log messages to user-friendly activity descriptions
    if (message.includes('login successful')) return '登入系統';
    if (message.includes('login')) return '嘗試登入';
    if (message.includes('created')) return '建立資源';
    if (message.includes('updated')) return '更新資源';
    if (message.includes('deleted')) return '刪除資源';
    if (message.includes('API call')) return 'API 呼叫';
    if (message.includes('error')) return '系統錯誤';
    if (message.includes('reset')) return '系統重置';
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }

  async login(ctx: Context): Promise<void> {
    try {
      const { email, password } = ctx.request.body as { email: string; password: string };

      // Validate input
      if (!email || !password) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Email and password are required'
          }
        };
        return;
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        };
        return;
      }

      // Verify password
      const isValidPassword = await validatePassword(password, user.password);

      if (!isValidPassword) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        };
        return;
      }

      // Check if user is admin (for now, check if email is admin@example.com)
      const isAdmin = email === 'admin@example.com';
      const role = isAdmin ? 'admin' : 'user';

      // Generate JWT token with extended properties
      const tokenPayload: any = {
        userId: user.id,
        email: user.email,
        role: role
      };
      const token = generateJWT(tokenPayload);

      // Log successful login
      this.loggerService.info(`Admin login successful: ${email}`);

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: role
          }
        }
      };
    } catch (error) {
      this.loggerService.error('Admin login error:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed'
        }
      };
    }
  }

  async logout(ctx: Context): Promise<void> {
    // Since we're using JWT, logout is handled client-side
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Logged out successfully'
    };
  }

  async getDashboardStats(ctx: Context): Promise<void> {
    try {
      // Get statistics
      const users = await this.userRepository.count();
      const services = await this.serviceRepository.count();

      // Get real request statistics
      const requestStats = requestStatsService.getTodayStats();
      const allStats = requestStatsService.getStats();

      // Get recent log entries as activities
      const recentLogs = await this.loggerService.getLogs({
        limit: 5,
        level: undefined
      });

      const recentActivities = recentLogs.map(log => ({
        timestamp: log.timestamp,
        user: log.meta?.user || log.meta?.email || 'System',
        action: this.formatLogMessageToActivity(log.message),
        status: log.level === 'error' ? 'error' : 'success'
      }));

      const stats = {
        users,
        services,
        apiCalls: requestStats.apiCalls,
        errors: requestStats.errors,
        successRate: requestStats.successRate,
        totalRequests: allStats.totalRequests,
        averageResponseTime: Math.round(allStats.averageResponseTime),
        recentActivities
      };

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: stats
      };
    } catch (error) {
      this.loggerService.error('Failed to get dashboard stats:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load dashboard statistics'
        }
      };
    }
  }

  async getSystemInfo(ctx: Context): Promise<void> {
    try {
      const systemInfo = await this.systemService.getSystemInfo();

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: systemInfo
      };
    } catch (error) {
      this.loggerService.error('Failed to get system info:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load system information'
        }
      };
    }
  }

  async getLogs(ctx: Context): Promise<void> {
    try {
      const { level, limit = 100, search } = ctx.query;
      const logs = await this.loggerService.getLogs({
        level: level as string,
        limit: Number(limit),
        search: search as string
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: logs
      };
    } catch (error) {
      this.loggerService.error('Failed to get logs:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load logs'
        }
      };
    }
  }

  async exportLogs(ctx: Context): Promise<void> {
    try {
      const logs = await this.loggerService.getLogs({ limit: 1000 });

      ctx.status = 200;
      ctx.type = 'application/json';
      ctx.attachment(`logs-${new Date().toISOString()}.json`);
      ctx.body = JSON.stringify(logs, null, 2);
    } catch (error) {
      this.loggerService.error('Failed to export logs:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to export logs'
        }
      };
    }
  }

  async getSchedulerTasks(ctx: Context): Promise<void> {
    try {
      const tasks = await this.schedulerService.getTasks();

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: tasks
      };
    } catch (error) {
      this.loggerService.error('Failed to get scheduler tasks:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load scheduler tasks'
        }
      };
    }
  }

  async createSchedulerTask(ctx: Context): Promise<void> {
    try {
      const taskData = ctx.request.body as any;
      const task = await this.schedulerService.createTask(taskData);

      ctx.status = 201;
      ctx.body = {
        success: true,
        data: task
      };
    } catch (error) {
      this.loggerService.error('Failed to create scheduler task:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create scheduler task'
        }
      };
    }
  }

  async updateSchedulerTask(ctx: Context): Promise<void> {
    try {
      const id = ctx.params['id'];
      const taskData = ctx.request.body as any;
      const task = await this.schedulerService.updateTask(id, taskData);

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: task
      };
    } catch (error) {
      this.loggerService.error('Failed to update scheduler task:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update scheduler task'
        }
      };
    }
  }

  async deleteSchedulerTask(ctx: Context): Promise<void> {
    try {
      const id = ctx.params['id'];
      await this.schedulerService.deleteTask(id);

      ctx.status = 200;
      ctx.body = {
        success: true,
        message: 'Task deleted successfully'
      };
    } catch (error) {
      this.loggerService.error('Failed to delete scheduler task:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete scheduler task'
        }
      };
    }
  }

  async runK6Test(ctx: Context): Promise<void> {
    try {
      const body = ctx.request.body as { scenario: string };

      // Mock implementation for now
      const testId = `test-${Date.now()}`;
      const testScenario = body.scenario || 'smoke';

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: {
          testId,
          scenario: testScenario,
          status: 'running',
          message: `K6 ${testScenario} test started successfully`
        }
      };
    } catch (error) {
      this.loggerService.error('Failed to run K6 test:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to run K6 test'
        }
      };
    }
  }

  async getK6Reports(ctx: Context): Promise<void> {
    try {
      // Mock implementation for now
      const reports = [
        {
          id: 'report-1',
          name: 'Smoke Test',
          date: new Date().toISOString(),
          status: 'completed',
          duration: '2m 30s',
          vus: 10,
          iterations: 100,
          success_rate: '99.5%'
        }
      ];

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: reports
      };
    } catch (error) {
      this.loggerService.error('Failed to get K6 reports:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load K6 reports'
        }
      };
    }
  }
}