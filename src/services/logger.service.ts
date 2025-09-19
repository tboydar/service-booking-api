import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs/promises';

interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  meta?: any;
}

interface LogQuery {
  level?: string;
  limit?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export class LoggerService {
  private logger: winston.Logger;
  private logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();

    // Create winston logger
    this.logger = winston.createLogger({
      level: process.env['LOG_LEVEL'] || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        // Write all logs to console
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // Write all logs to combined.log
        new winston.transports.File({
          filename: path.join(this.logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // Write error logs to error.log
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  // Logging methods
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: any): void {
    this.logger.error(message, error);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  // Get logs for admin panel
  async getLogs(query: LogQuery = {}): Promise<LogEntry[]> {
    try {
      const { level, limit = 100, search } = query;
      const logs: LogEntry[] = [];

      // Read combined log file
      const logFilePath = path.join(this.logDir, 'combined.log');

      try {
        const content = await fs.readFile(logFilePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const logEntry = JSON.parse(line);

            // Filter by level if specified
            if (level && logEntry.level !== level) {
              continue;
            }

            // Filter by search term if specified
            if (search && !logEntry.message.toLowerCase().includes(search.toLowerCase())) {
              continue;
            }

            logs.push({
              timestamp: new Date(logEntry.timestamp),
              level: logEntry.level,
              message: logEntry.message,
              meta: logEntry.meta
            });
          } catch (parseError) {
            // Skip malformed log entries
          }
        }
      } catch (readError) {
        // Log file might not exist yet
        this.info('Log file does not exist yet');
      }

      // Sort by timestamp descending and limit
      return logs
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      this.error('Failed to get logs:', error);
      return [];
    }
  }

  // Clear old logs
  async clearOldLogs(daysToKeep: number = 7): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      const now = Date.now();
      const cutoff = now - (daysToKeep * 24 * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtimeMs < cutoff) {
          await fs.unlink(filePath);
          this.info(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Failed to clear old logs:', error);
    }
  }

  // Get log statistics
  async getLogStats(): Promise<{
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    logFileSize: number;
  }> {
    try {
      const logs = await this.getLogs({ limit: 10000 });

      const stats = {
        totalLogs: logs.length,
        errorCount: logs.filter(log => log.level === 'error').length,
        warnCount: logs.filter(log => log.level === 'warn').length,
        infoCount: logs.filter(log => log.level === 'info').length,
        logFileSize: 0
      };

      // Get total size of log files
      const files = await fs.readdir(this.logDir);
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const fileStats = await fs.stat(filePath);
        stats.logFileSize += fileStats.size;
      }

      return stats;
    } catch (error) {
      this.error('Failed to get log stats:', error);
      return {
        totalLogs: 0,
        errorCount: 0,
        warnCount: 0,
        infoCount: 0,
        logFileSize: 0
      };
    }
  }
}