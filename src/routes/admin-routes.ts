import Router from '@koa/router';
import { Context } from 'koa';
import * as path from 'path';
import * as fs from 'fs/promises';
import { AdminController } from '../controllers/admin.controller';
import { adminAuth } from '../middlewares/admin-auth';
import { adminAuthWithRedirect } from '../middlewares/admin-auth-redirect';
import { SystemService } from '../services/system.service';
import { LoggerService } from '../services/logger.service';
import { SchedulerService } from '../services/scheduler.service';

const router = new Router({
  prefix: '/admin'
});

// Initialize services
const systemService = new SystemService();
const loggerService = new LoggerService();
const schedulerService = new SchedulerService();
const adminController = new AdminController(systemService, loggerService, schedulerService);

// Serve static files
router.get('/css/:file', async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/public/css', ctx.params['file']);
  ctx.type = 'text/css';
  ctx.body = await fs.readFile(filePath, 'utf-8');
});

router.get('/js/:file', async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/public/js', ctx.params['file']);
  ctx.type = 'application/javascript';
  ctx.body = await fs.readFile(filePath, 'utf-8');
});

// Admin login page (no auth required)
router.get('/login', async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/login.html');
  ctx.type = 'html';
  ctx.body = await fs.readFile(filePath, 'utf-8');
});

// Admin login API
router.post('/login', async (ctx: Context) => {
  await adminController.login(ctx);
});

// Admin logout
router.post('/logout', adminAuth, async (ctx: Context) => {
  await adminController.logout(ctx);
});

// Admin root route - check auth and redirect accordingly
router.get('/', async (ctx: Context) => {
  // Simply redirect to login - authentication check will happen there
  ctx.redirect('/admin/login');
});

router.get('/dashboard', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/dashboard.html');
  ctx.type = 'html';
  ctx.body = await fs.readFile(filePath, 'utf-8');
});

router.get('/system', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/system.html');
  try {
    ctx.type = 'html';
    ctx.body = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    // If file doesn't exist, create a basic system page
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>系統監控</title>
        <link rel="stylesheet" href="/admin/css/admin.css">
      </head>
      <body>
        <div class="admin-wrapper">
          <nav class="sidebar">
            <div class="sidebar-header"><h3>🎯 管理後台</h3></div>
            <ul class="sidebar-menu">
              <li><a href="/admin/dashboard">📊 儀表板</a></li>
              <li><a href="/admin/system" class="active">💻 系統監控</a></li>
              <li><a href="/admin/logs">📝 日誌管理</a></li>
              <li><a href="/admin/scheduler">⏰ 排程管理</a></li>
              <li><a href="#" id="logoutBtn">🚪 登出</a></li>
            </ul>
          </nav>
          <main class="main-content">
            <div class="header"><h1>系統監控</h1></div>
            <div class="card">
              <div class="card-header"><h2 class="card-title">系統資訊</h2></div>
              <div class="card-body" id="systemInfo">載入中...</div>
            </div>
          </main>
        </div>
        <script src="/admin/js/admin.js"></script>
      </body>
      </html>
    `;
  }
});

router.get('/logs', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/logs.html');
  try {
    ctx.type = 'html';
    ctx.body = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>日誌管理</title>
        <link rel="stylesheet" href="/admin/css/admin.css">
      </head>
      <body>
        <div class="admin-wrapper">
          <nav class="sidebar">
            <div class="sidebar-header"><h3>🎯 管理後台</h3></div>
            <ul class="sidebar-menu">
              <li><a href="/admin/dashboard">📊 儀表板</a></li>
              <li><a href="/admin/system">💻 系統監控</a></li>
              <li><a href="/admin/logs" class="active">📝 日誌管理</a></li>
              <li><a href="/admin/scheduler">⏰ 排程管理</a></li>
              <li><a href="#" id="logoutBtn">🚪 登出</a></li>
            </ul>
          </nav>
          <main class="main-content">
            <div class="header"><h1>日誌管理</h1></div>
            <div class="card">
              <div class="card-header"><h2 class="card-title">系統日誌</h2></div>
              <div class="card-body" id="logContainer">載入中...</div>
            </div>
          </main>
        </div>
        <script src="/admin/js/admin.js"></script>
      </body>
      </html>
    `;
  }
});

router.get('/scheduler', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/scheduler.html');
  try {
    ctx.type = 'html';
    ctx.body = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>排程管理</title>
        <link rel="stylesheet" href="/admin/css/admin.css">
      </head>
      <body>
        <div class="admin-wrapper">
          <nav class="sidebar">
            <div class="sidebar-header"><h3>🎯 管理後台</h3></div>
            <ul class="sidebar-menu">
              <li><a href="/admin/dashboard">📊 儀表板</a></li>
              <li><a href="/admin/system">💻 系統監控</a></li>
              <li><a href="/admin/logs">📝 日誌管理</a></li>
              <li><a href="/admin/scheduler" class="active">⏰ 排程管理</a></li>
              <li><a href="#" id="logoutBtn">🚪 登出</a></li>
            </ul>
          </nav>
          <main class="main-content">
            <div class="header"><h1>排程管理</h1></div>
            <div class="card">
              <div class="card-header"><h2 class="card-title">排程任務</h2></div>
              <div class="card-body" id="schedulerTasks">載入中...</div>
            </div>
          </main>
        </div>
        <script src="/admin/js/admin.js"></script>
      </body>
      </html>
    `;
  }
});

// API endpoints
router.get('/api/dashboard/stats', adminAuth, async (ctx: Context) => {
  await adminController.getDashboardStats(ctx);
});

router.get('/api/system', adminAuth, async (ctx: Context) => {
  await adminController.getSystemInfo(ctx);
});

router.get('/api/logs', adminAuth, async (ctx: Context) => {
  await adminController.getLogs(ctx);
});

router.get('/api/logs/export', adminAuth, async (ctx: Context) => {
  await adminController.exportLogs(ctx);
});

router.get('/api/scheduler', adminAuth, async (ctx: Context) => {
  await adminController.getSchedulerTasks(ctx);
});

router.post('/api/scheduler', adminAuth, async (ctx: Context) => {
  await adminController.createSchedulerTask(ctx);
});

router.put('/api/scheduler/:id', adminAuth, async (ctx: Context) => {
  await adminController.updateSchedulerTask(ctx);
});

router.delete('/api/scheduler/:id', adminAuth, async (ctx: Context) => {
  await adminController.deleteSchedulerTask(ctx);
});

router.post('/api/k6/run', adminAuth, async (ctx: Context) => {
  await adminController.runK6Test(ctx);
});

router.get('/api/k6/reports', adminAuth, async (ctx: Context) => {
  await adminController.getK6Reports(ctx);
});

// K6 Test page
router.get('/k6-test', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/k6-test.html');
  try {
    ctx.type = 'html';
    ctx.body = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    ctx.throw(404, 'K6 test page not found');
  }
});

// Services management pages
router.get('/services', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/services.html');
  try {
    ctx.type = 'html';
    ctx.body = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    ctx.throw(404, 'Services page not found');
  }
});

router.get('/services/new', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/service-new.html');
  try {
    ctx.type = 'html';
    ctx.body = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    ctx.throw(404, 'New service page not found');
  }
});

router.get('/services/edit/:id', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/service-edit.html');
  try {
    ctx.type = 'html';
    ctx.body = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    ctx.throw(404, 'Edit service page not found');
  }
});

// Users management page
router.get('/users', adminAuthWithRedirect, async (ctx: Context) => {
  const filePath = path.join(__dirname, '../../admin/views/users.html');
  try {
    ctx.type = 'html';
    ctx.body = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    ctx.throw(404, 'Users page not found');
  }
});

export function createAdminRoutes(): Router {
  return router;
}

export { router as adminRoutes };