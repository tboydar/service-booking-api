import * as schedule from 'node-schedule';
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import * as path from 'path';

interface JobAttributes {
  id: string;
  name: string;
  cron: string;
  task: string;
  status: 'active' | 'inactive' | 'paused';
  lastRun?: Date;
  nextRun?: Date;
  lastResult?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'status' | 'lastRun' | 'nextRun' | 'lastResult' | 'createdAt' | 'updatedAt'> {}

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: string;
  public name!: string;
  public cron!: string;
  public task!: string;
  public status!: 'active' | 'inactive' | 'paused';
  public lastRun?: Date;
  public nextRun?: Date;
  public lastResult?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export class SchedulerService {
  private jobs: Map<string, schedule.Job>;
  private sequelize: Sequelize;
  private JobModel!: typeof Job;

  constructor() {
    this.jobs = new Map();

    // Initialize queue database
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(process.cwd(), 'queue.sqlite'),
      logging: false
    });

    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Define Job model
      Job.init(
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
          },
          cron: {
            type: DataTypes.STRING,
            allowNull: false
          },
          task: {
            type: DataTypes.TEXT,
            allowNull: false
          },
          status: {
            type: DataTypes.ENUM('active', 'inactive', 'paused'),
            defaultValue: 'inactive'
          },
          lastRun: {
            type: DataTypes.DATE,
            allowNull: true
          },
          nextRun: {
            type: DataTypes.DATE,
            allowNull: true
          },
          lastResult: {
            type: DataTypes.TEXT,
            allowNull: true
          }
        },
        {
          sequelize: this.sequelize,
          modelName: 'Job',
          tableName: 'jobs',
          timestamps: true
        }
      );

      this.JobModel = Job;

      // Sync database
      await this.sequelize.sync();

      // Load and start active jobs
      await this.loadActiveJobs();
    } catch (error) {
      console.error('Failed to initialize scheduler database:', error);
    }
  }

  private async loadActiveJobs(): Promise<void> {
    try {
      const activeJobs = await this.JobModel.findAll({
        where: { status: 'active' }
      });

      for (const job of activeJobs) {
        this.scheduleJob(job);
      }
    } catch (error) {
      console.error('Failed to load active jobs:', error);
    }
  }

  private scheduleJob(job: Job): void {
    try {
      // Cancel existing job if any
      const existingJob = this.jobs.get(job.id);
      if (existingJob) {
        existingJob.cancel();
      }

      // Schedule new job
      const scheduledJob = schedule.scheduleJob(job.cron, async () => {
        try {
          // Update last run time
          job.lastRun = new Date();

          // Execute task (for now, just log it)
          console.log(`Executing job: ${job.name}`);

          // In a real implementation, you would execute the actual task here
          // For example: await this.executeTask(job.task);

          job.lastResult = 'success';

          // Calculate next run
          const nextInvocation = scheduledJob.nextInvocation();
          if (nextInvocation) {
            job.nextRun = nextInvocation;
          }

          await job.save();
        } catch (error) {
          console.error(`Failed to execute job ${job.name}:`, error);
          job.lastResult = `error: ${error}`;
          await job.save();
        }
      });

      // Store scheduled job
      this.jobs.set(job.id, scheduledJob);

      // Update next run time
      const nextInvocation = scheduledJob.nextInvocation();
      if (nextInvocation) {
        job.nextRun = nextInvocation;
        job.save();
      }
    } catch (error) {
      console.error(`Failed to schedule job ${job.name}:`, error);
    }
  }

  async getTasks(): Promise<JobAttributes[]> {
    try {
      const jobs = await this.JobModel.findAll({
        order: [['createdAt', 'DESC']]
      });

      return jobs.map(job => job.toJSON());
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  }

  async createTask(taskData: Partial<JobCreationAttributes>): Promise<JobAttributes> {
    try {
      const job = await this.JobModel.create({
        name: taskData.name!,
        cron: taskData.cron!,
        task: taskData.task!,
        status: taskData.status || 'inactive'
      });

      if (job.status === 'active') {
        this.scheduleJob(job);
      }

      return job.toJSON();
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(id: string, taskData: Partial<JobAttributes>): Promise<JobAttributes> {
    try {
      const job = await this.JobModel.findByPk(id);

      if (!job) {
        throw new Error('Task not found');
      }

      // Update job properties
      if (taskData.name) job.name = taskData.name;
      if (taskData.cron) job.cron = taskData.cron;
      if (taskData.task) job.task = taskData.task;
      if (taskData.status) job.status = taskData.status;

      await job.save();

      // Reschedule if necessary
      if (job.status === 'active') {
        this.scheduleJob(job);
      } else {
        // Cancel job if it exists
        const scheduledJob = this.jobs.get(job.id);
        if (scheduledJob) {
          scheduledJob.cancel();
          this.jobs.delete(job.id);
        }
      }

      return job.toJSON();
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const job = await this.JobModel.findByPk(id);

      if (!job) {
        throw new Error('Task not found');
      }

      // Cancel scheduled job
      const scheduledJob = this.jobs.get(job.id);
      if (scheduledJob) {
        scheduledJob.cancel();
        this.jobs.delete(job.id);
      }

      await job.destroy();
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  async runTaskNow(id: string): Promise<void> {
    try {
      const job = await this.JobModel.findByPk(id);

      if (!job) {
        throw new Error('Task not found');
      }

      // Execute task immediately
      console.log(`Manually executing job: ${job.name}`);
      job.lastRun = new Date();
      job.lastResult = 'success - manual run';
      await job.save();
    } catch (error) {
      console.error('Failed to run task:', error);
      throw error;
    }
  }

  // Predefined tasks
  getPredefinedTasks(): Array<{ name: string; cron: string; description: string }> {
    return [
      {
        name: 'Database Backup',
        cron: '0 2 * * *',
        description: '每天凌晨 2 點備份資料庫'
      },
      {
        name: 'Clear Old Logs',
        cron: '0 3 * * 0',
        description: '每週日凌晨 3 點清理舊日誌'
      },
      {
        name: 'Generate Reports',
        cron: '0 9 * * 1',
        description: '每週一早上 9 點生成報表'
      },
      {
        name: 'Health Check',
        cron: '*/5 * * * *',
        description: '每 5 分鐘執行健康檢查'
      },
      {
        name: 'Cache Cleanup',
        cron: '0 */6 * * *',
        description: '每 6 小時清理快取'
      }
    ];
  }
}