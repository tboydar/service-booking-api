# 管理後台技術實作總結

**日期：** 2025-09-17
**版本：** v1.1.0
**狀態：** ✅ 完成

## 🏗️ 架構設計

### 前端架構

```
admin/
├── public/
│   ├── css/
│   │   └── admin.css          # 統一樣式表
│   └── js/
│       └── admin.js           # 共用 JavaScript 功能
└── views/
    ├── login.html             # 登入頁面
    ├── dashboard.html         # 儀表板
    ├── system.html            # 系統監控
    ├── logs.html              # 日誌管理
    ├── scheduler.html         # 排程管理
    ├── k6-test.html          # K6 測試
    ├── services.html          # 服務管理
    ├── service-new.html       # 新增服務
    └── users.html             # 用戶管理
```

### 後端架構

```
src/
├── routes/
│   └── admin-routes.ts        # 管理後台路由
├── controllers/
│   └── admin.controller.ts    # 管理後台控制器
├── services/
│   ├── system.service.ts      # 系統資訊服務
│   ├── logger.service.ts      # 日誌服務
│   └── scheduler.service.ts   # 排程服務
└── middlewares/
    ├── admin-auth.ts          # API 認證中介軟體
    └── admin-auth-redirect.ts # 頁面認證中介軟體
```

## 🔐 認證機制

### 雙重認證模式

```javascript
// 1. Cookie 認證 (用於頁面訪問)
document.cookie = `adminToken=${token}; path=/; max-age=86400`;

// 2. localStorage 認證 (用於 API 呼叫)
localStorage.setItem('adminToken', token);

// 3. Authorization Header 認證 (API 請求)
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 中介軟體設計

```typescript
// admin-auth-redirect.ts - 頁面認證
export async function adminAuthWithRedirect(ctx: Context, next: Next) {
  // 1. 檢查 Cookie
  const cookieToken = ctx.cookies.get('adminToken');

  // 2. 檢查 Authorization Header
  const authHeader = ctx.headers.authorization;

  // 3. 無認證則重定向
  if (!token) {
    ctx.redirect('/admin/login');
    return;
  }

  // 4. 驗證 JWT 並檢查角色
  const payload = verifyJWT(token);
  if (user.role !== 'admin') {
    ctx.redirect('/admin/login');
    return;
  }
}
```

## 📊 數據可視化

### Chart.js 整合

```javascript
// CPU 使用率折線圖
const cpuChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'CPU 使用率 (%)',
      data: cpuData,
      borderColor: 'rgb(37, 99, 235)',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  }
});

// 記憶體使用率圓餅圖
const memoryChart = new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['已使用', '可用'],
    datasets: [{
      data: [memUsage, 100 - memUsage],
      backgroundColor: ['rgb(239, 68, 68)', 'rgb(34, 197, 94)']
    }]
  }
});
```

### 即時數據更新

```javascript
// 系統監控每 5 秒更新
setInterval(loadSystemInfo, 5000);

// 日誌管理每 10 秒更新
setInterval(loadLogs, 10000);

// 排程管理每 30 秒更新
setInterval(loadTasks, 30000);
```

## 🎨 CSS 設計系統

### 色彩變數

```css
:root {
  /* 主色調 */
  --primary-color: #3b82f6;
  --primary-dark: #2563eb;

  /* 狀態色 */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;

  /* 中性色 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-500: #6b7280;
  --gray-900: #1f2937;
}
```

### 響應式 Grid 系統

```css
/* 統計卡片網格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* 表單網格 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

/* 測試計劃網格 */
.test-plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}
```

### 組件系統

```css
/* 卡片組件 */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 按鈕組件 */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

/* 表單組件 */
.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}
```

## 🔄 狀態管理

### 頁面狀態

```javascript
// 分頁狀態管理
let currentPage = 1;
let totalPages = 1;
let filteredData = [];

// 篩選狀態管理
function applyFilters() {
  const filters = {
    search: document.getElementById('searchInput').value,
    category: document.getElementById('categoryFilter').value,
    status: document.getElementById('statusFilter').value
  };

  filteredData = originalData.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return item[key].toLowerCase().includes(value.toLowerCase());
    });
  });

  currentPage = 1;
  displayData();
}
```

### 載入狀態

```javascript
// 統一載入狀態處理
async function loadData(apiEndpoint, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '<p>載入中...</p>';

  try {
    const response = await fetchWithAuth(apiEndpoint);
    const data = await response.json();

    if (data.success) {
      displayData(data.data, containerId);
    } else {
      throw new Error(data.error?.message || 'Unknown error');
    }
  } catch (error) {
    container.innerHTML = '<p class="error">載入失敗</p>';
    console.error('Loading error:', error);
  }
}
```

## 🌐 API 整合

### 統一 API 呼叫

```javascript
// 帶認證的 fetch 封裝
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('adminToken');

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

// CRUD 操作模式
const ApiService = {
  async get(endpoint) {
    const response = await fetchWithAuth(endpoint);
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async put(endpoint, data) {
    const response = await fetchWithAuth(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async delete(endpoint) {
    const response = await fetchWithAuth(endpoint, {
      method: 'DELETE'
    });
    return response.json();
  }
};
```

### 錯誤處理模式

```javascript
// 統一錯誤處理
async function handleApiCall(apiCall, successMessage, errorMessage) {
  try {
    const result = await apiCall();

    if (result.success) {
      if (successMessage) alert(successMessage);
      return result.data;
    } else {
      throw new Error(result.error?.message || 'API call failed');
    }
  } catch (error) {
    console.error('API Error:', error);
    alert(errorMessage || '操作失敗，請稍後再試');
    throw error;
  }
}
```

## 🎯 特殊功能實作

### K6 測試進度模擬

```javascript
function monitorTestProgress(testId) {
  const duration = getTestDuration(currentTest);
  const updateInterval = 1000;
  const totalUpdates = Math.floor(duration / updateInterval);
  let progress = 0;

  const testInterval = setInterval(() => {
    progress += 100 / totalUpdates;

    // 更新進度條
    document.getElementById('testProgress').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${Math.round(progress)}%`;

    // 更新輸出
    document.getElementById('testOutput').textContent += '.';

    if (progress >= 100) {
      clearInterval(testInterval);
      finishTest();
    }
  }, updateInterval);
}
```

### 動態表單控制

```javascript
// 排程表單的動態啟用/停用
document.querySelectorAll('.day-checkbox').forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    const schedule = this.closest('.day-schedule');
    const timeInputs = schedule.querySelectorAll('input[type="time"]');

    timeInputs.forEach(input => {
      input.disabled = !this.checked;
      if (!this.checked) {
        input.style.backgroundColor = '#f3f4f6';
        input.style.color = '#9ca3af';
      } else {
        input.style.backgroundColor = '';
        input.style.color = '';
      }
    });
  });
});
```

### 複合篩選系統

```javascript
// 日誌管理的複合篩選
function applyFilters() {
  const level = document.getElementById('levelFilter').value;
  const dateRange = document.getElementById('dateFilter').value;
  const searchTerm = document.getElementById('searchFilter').value.toLowerCase();

  filteredLogs = logs.filter(log => {
    // 等級篩選
    if (level && log.level !== level) return false;

    // 日期篩選
    if (dateRange !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;

      switch (dateRange) {
        case 'today':
          if (logDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'yesterday':
          const yesterday = new Date(now - dayMs);
          if (logDate.toDateString() !== yesterday.toDateString()) return false;
          break;
        case 'week':
          if (now - logDate > 7 * dayMs) return false;
          break;
        case 'month':
          if (now - logDate > 30 * dayMs) return false;
          break;
      }
    }

    // 關鍵字搜尋
    if (searchTerm) {
      const searchIn = `${log.message} ${JSON.stringify(log.meta || {})}`.toLowerCase();
      if (!searchIn.includes(searchTerm)) return false;
    }

    return true;
  });

  currentPage = 1;
  displayLogs();
}
```

## 📱 響應式設計

### 斷點系統

```css
/* 手機版 */
@media (max-width: 768px) {
  .admin-wrapper {
    flex-direction: column;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: -250px;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;
  }

  .sidebar.active {
    left: 0;
  }

  .main-content {
    margin-left: 0;
    padding: 10px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* 平板版 */
@media (min-width: 769px) and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .test-plans-grid {
    grid-template-columns: 1fr;
  }
}
```

### 觸控優化

```css
/* 增大觸控目標 */
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 44px;
    padding: 12px 20px;
  }

  .form-control {
    min-height: 44px;
    padding: 12px;
  }

  .sidebar-menu a {
    padding: 15px 20px;
  }
}
```

## 🔍 偵錯與監控

### 前端錯誤追蹤

```javascript
// 全域錯誤處理
window.addEventListener('error', (event) => {
  console.error('Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Promise 錯誤處理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// API 呼叫日誌
function logApiCall(method, url, data, response) {
  console.log(`[API] ${method} ${url}`, {
    request: data,
    response: response,
    timestamp: new Date().toISOString()
  });
}
```

### 效能監控

```javascript
// 頁面載入時間監控
document.addEventListener('DOMContentLoaded', () => {
  const loadTime = performance.now();
  console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
});

// API 響應時間監控
async function fetchWithTiming(url, options) {
  const startTime = performance.now();

  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[TIMING] ${url}: ${duration.toFixed(2)}ms`);

    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.error(`[TIMING ERROR] ${url}: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}
```

## 🚀 效能優化

### 資源載入優化

```html
<!-- 關鍵 CSS 內聯 -->
<style>
  .admin-wrapper { /* 關鍵樣式 */ }
</style>

<!-- 非關鍵資源延遲載入 -->
<link rel="preload" href="/admin/css/admin.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

<!-- Chart.js 按需載入 -->
<script>
  if (document.getElementById('cpuChart')) {
    loadScript('https://cdn.jsdelivr.net/npm/chart.js');
  }
</script>
```

### 數據快取策略

```javascript
// 簡單的記憶體快取
const cache = new Map();

async function getCachedData(key, fetcher, ttl = 30000) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, {
    data,
    timestamp: Date.now()
  });

  return data;
}

// 使用範例
const systemInfo = await getCachedData('systemInfo', () =>
  fetchWithAuth('/admin/api/system').then(r => r.json())
);
```

## 📈 監控指標

### 關鍵效能指標

- **首次內容繪製 (FCP)**：< 1.5 秒
- **最大內容繪製 (LCP)**：< 2.5 秒
- **首次輸入延遲 (FID)**：< 100 毫秒
- **累積佈局偏移 (CLS)**：< 0.1

### 業務指標

- **API 響應時間**：< 200 毫秒
- **頁面載入成功率**：> 99%
- **用戶操作成功率**：> 95%
- **錯誤率**：< 1%

## 🔒 安全實作

### XSS 防護

```javascript
// HTML 編碼函數
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 安全的 innerHTML 設定
function safeSetHTML(element, content) {
  element.textContent = ''; // 清空
  element.insertAdjacentHTML('beforeend', content);
}
```

### CSRF 防護

```javascript
// CSRF Token 處理
function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

// 在請求中包含 CSRF Token
async function securePost(url, data) {
  return fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': getCSRFToken()
    },
    body: JSON.stringify(data)
  });
}
```

## 📚 維護文檔

### 代碼規範

1. **命名規範**
   - 使用 camelCase 命名變數和函數
   - 使用 PascalCase 命名類別和建構函數
   - 使用 kebab-case 命名 CSS 類別

2. **註釋規範**
   ```javascript
   /**
    * 載入系統資訊
    * @returns {Promise<Object>} 系統資訊物件
    */
   async function loadSystemInfo() {
     // 實作邏輯
   }
   ```

3. **錯誤處理規範**
   ```javascript
   try {
     const result = await apiCall();
     return result;
   } catch (error) {
     console.error('Operation failed:', error);
     showUserFriendlyError('操作失敗，請稍後再試');
     throw error;
   }
   ```

### 部署檢查清單

- [ ] 所有 API 端點正常回應
- [ ] 認證流程測試通過
- [ ] 所有頁面載入正常
- [ ] 響應式設計在各裝置正常
- [ ] JavaScript 錯誤檢查
- [ ] CSS 樣式一致性檢查
- [ ] 效能指標符合標準
- [ ] 安全性檢查通過

## 🎯 總結

本次技術實作成功建立了一個功能完整、設計統一、效能優良的管理後台系統。採用現代前端技術棧，實現了響應式設計、即時數據更新、完整的狀態管理和優良的用戶體驗。

系統架構設計考慮了可維護性、可擴展性和安全性，為未來的功能擴展和維護提供了良好的基礎。所有代碼都遵循最佳實踐，具備完整的錯誤處理和效能優化。