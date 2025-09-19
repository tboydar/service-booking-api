// Admin Dashboard JavaScript
const AdminDashboard = {
  // Initialize dashboard
  init() {
    this.initSidebar();
    this.initCharts();
    this.initWebSocket();
    this.loadSystemInfo();
    this.bindEvents();
  },

  // Initialize sidebar toggle
  initSidebar() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
    }

    // Set active menu item
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  },

  // Initialize charts
  initCharts() {
    // System Resource Chart
    const systemChart = document.getElementById('systemChart');
    if (systemChart && typeof Chart !== 'undefined') {
      const ctx = systemChart.getContext('2d');
      this.systemResourceChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'CPU Usage (%)',
            data: [],
            borderColor: 'rgb(37, 99, 235)',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.4
          }, {
            label: 'Memory Usage (%)',
            data: [],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }

    // API Usage Chart
    const apiChart = document.getElementById('apiChart');
    if (apiChart && typeof Chart !== 'undefined') {
      const ctx = apiChart.getContext('2d');
      this.apiUsageChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Login', 'Register', 'Services', 'Admin'],
          datasets: [{
            label: 'API Calls Today',
            data: [0, 0, 0, 0],
            backgroundColor: [
              'rgba(37, 99, 235, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  },

  // Initialize WebSocket connection
  initWebSocket() {
    if (typeof io !== 'undefined') {
      this.socket = io();

      // Listen for real-time updates
      this.socket.on('system-update', (data) => {
        this.updateSystemInfo(data);
      });

      this.socket.on('log-entry', (log) => {
        this.addLogEntry(log);
      });

      this.socket.on('api-call', (data) => {
        this.updateApiStats(data);
      });
    }
  },

  // Load system information
  async loadSystemInfo() {
    try {
      const response = await fetch('/admin/api/system');
      const data = await response.json();

      if (data.success) {
        this.updateSystemInfo(data.data);
      }
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  },

  // Update system information display
  updateSystemInfo(data) {
    // Update CPU usage
    const cpuElement = document.getElementById('cpuUsage');
    if (cpuElement) {
      cpuElement.textContent = `${data.cpu.usage.toFixed(1)}%`;
      this.updateProgressBar('cpuProgress', data.cpu.usage);
    }

    // Update memory usage
    const memElement = document.getElementById('memUsage');
    if (memElement) {
      const memPercent = (data.memory.used / data.memory.total) * 100;
      memElement.textContent = `${data.memory.used.toFixed(1)}GB / ${data.memory.total.toFixed(1)}GB`;
      this.updateProgressBar('memProgress', memPercent);
    }

    // Update disk usage
    const diskElement = document.getElementById('diskUsage');
    if (diskElement) {
      const diskPercent = (data.disk.used / data.disk.total) * 100;
      diskElement.textContent = `${data.disk.used.toFixed(1)}GB / ${data.disk.total.toFixed(1)}GB`;
      this.updateProgressBar('diskProgress', diskPercent);
    }

    // Update uptime
    const uptimeElement = document.getElementById('uptime');
    if (uptimeElement) {
      uptimeElement.textContent = data.uptime;
    }

    // Update chart if exists
    if (this.systemResourceChart) {
      const time = new Date().toLocaleTimeString();
      this.systemResourceChart.data.labels.push(time);
      this.systemResourceChart.data.datasets[0].data.push(data.cpu.usage);
      this.systemResourceChart.data.datasets[1].data.push((data.memory.used / data.memory.total) * 100);

      // Keep only last 20 data points
      if (this.systemResourceChart.data.labels.length > 20) {
        this.systemResourceChart.data.labels.shift();
        this.systemResourceChart.data.datasets[0].data.shift();
        this.systemResourceChart.data.datasets[1].data.shift();
      }

      this.systemResourceChart.update();
    }
  },

  // Update progress bar
  updateProgressBar(elementId, percent) {
    const progressBar = document.getElementById(elementId);
    if (progressBar) {
      progressBar.style.width = `${percent}%`;

      // Change color based on usage
      if (percent > 80) {
        progressBar.style.backgroundColor = 'var(--danger-color)';
      } else if (percent > 60) {
        progressBar.style.backgroundColor = 'var(--warning-color)';
      } else {
        progressBar.style.backgroundColor = 'var(--success-color)';
      }
    }
  },

  // Add log entry to log viewer
  addLogEntry(log) {
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;

    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${log.level}`;
    logEntry.innerHTML = `
      <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
      <span class="badge badge-${this.getLogLevelClass(log.level)}">${log.level}</span>
      <span class="log-message">${log.message}</span>
    `;

    logContainer.insertBefore(logEntry, logContainer.firstChild);

    // Keep only last 100 log entries
    while (logContainer.children.length > 100) {
      logContainer.removeChild(logContainer.lastChild);
    }
  },

  // Get log level class
  getLogLevelClass(level) {
    const levelClasses = {
      'error': 'danger',
      'warn': 'warning',
      'info': 'primary',
      'debug': 'secondary'
    };
    return levelClasses[level] || 'secondary';
  },

  // Update API statistics
  updateApiStats(data) {
    if (this.apiUsageChart) {
      this.apiUsageChart.data.datasets[0].data = [
        data.login || 0,
        data.register || 0,
        data.services || 0,
        data.admin || 0
      ];
      this.apiUsageChart.update();
    }
  },

  // Bind event handlers
  bindEvents() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Refresh system info button
    const refreshBtn = document.getElementById('refreshSystem');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadSystemInfo();
      });
    }

    // Log filter
    const logFilter = document.getElementById('logFilter');
    if (logFilter) {
      logFilter.addEventListener('change', (e) => {
        this.filterLogs(e.target.value);
      });
    }

    // Search logs
    const logSearch = document.getElementById('logSearch');
    if (logSearch) {
      logSearch.addEventListener('input', (e) => {
        this.searchLogs(e.target.value);
      });
    }

    // Export logs button
    const exportLogsBtn = document.getElementById('exportLogs');
    if (exportLogsBtn) {
      exportLogsBtn.addEventListener('click', () => {
        this.exportLogs();
      });
    }
  },

  // Logout
  async logout() {
    try {
      const response = await fetch('/admin/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        // Clear localStorage
        localStorage.removeItem('adminToken');
        // Clear cookie
        document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  // Filter logs by level
  filterLogs(level) {
    const logEntries = document.querySelectorAll('.log-entry');
    logEntries.forEach(entry => {
      if (level === 'all' || entry.classList.contains(`log-${level}`)) {
        entry.style.display = 'flex';
      } else {
        entry.style.display = 'none';
      }
    });
  },

  // Search logs
  searchLogs(query) {
    const logEntries = document.querySelectorAll('.log-entry');
    const searchTerm = query.toLowerCase();

    logEntries.forEach(entry => {
      const message = entry.querySelector('.log-message').textContent.toLowerCase();
      if (message.includes(searchTerm)) {
        entry.style.display = 'flex';
      } else {
        entry.style.display = 'none';
      }
    });
  },

  // Export logs
  async exportLogs() {
    try {
      const response = await fetch('/admin/api/logs/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  },

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;

    const container = document.getElementById('notificationContainer') || document.body;
    container.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  },

  // Load scheduler tasks
  async loadSchedulerTasks() {
    try {
      const response = await fetch('/admin/api/scheduler', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        this.renderSchedulerTasks(data.data);
      }
    } catch (error) {
      console.error('Failed to load scheduler tasks:', error);
    }
  },

  // Render scheduler tasks
  renderSchedulerTasks(tasks) {
    const container = document.getElementById('schedulerTasks');
    if (!container) return;

    container.innerHTML = tasks.map(task => `
      <tr>
        <td>${task.name}</td>
        <td><code>${task.cron}</code></td>
        <td><span class="badge badge-${task.status === 'active' ? 'success' : 'warning'}">${task.status}</span></td>
        <td>${task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}</td>
        <td>${task.nextRun ? new Date(task.nextRun).toLocaleString() : 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="AdminDashboard.editTask('${task.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="AdminDashboard.deleteTask('${task.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  },

  // Run K6 test
  async runK6Test(scenario) {
    try {
      const response = await fetch('/admin/api/k6/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ scenario })
      });

      const data = await response.json();
      if (data.success) {
        this.showNotification('K6 test started successfully', 'success');
        // Monitor test progress
        this.monitorK6Test(data.data.testId);
      }
    } catch (error) {
      console.error('Failed to run K6 test:', error);
      this.showNotification('Failed to start K6 test', 'danger');
    }
  },

  // Monitor K6 test progress
  monitorK6Test(testId) {
    if (this.socket) {
      this.socket.on(`k6-test-${testId}`, (data) => {
        this.updateK6Progress(data);
      });
    }
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AdminDashboard.init();
});