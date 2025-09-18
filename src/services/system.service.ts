import * as si from 'systeminformation';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    unit: string;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    unit: string;
  };
  network: {
    ip: string;
    connections: number;
    interfaces: any[];
  };
  database: {
    size: number;
    tables: number;
    unit: string;
  };
  uptime: string;
  platform: string;
  hostname: string;
  nodeVersion: string;
}

export class SystemService {
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      // Get CPU information
      const cpuInfo = await si.cpu();
      const currentLoad = await si.currentLoad();

      // Get memory information
      const memInfo = await si.mem();

      // Get disk information
      const diskInfo = await si.fsSize();
      const mainDisk = diskInfo[0] || { size: 0, used: 0, available: 0 };

      // Get network information
      const networkInterfaces = await si.networkInterfaces();
      const networkConnections = await si.networkConnections();

      // Get database information
      const dbPath = path.join(process.cwd(), 'database.sqlite');
      let dbSize = 0;
      try {
        const stats = await fs.stat(dbPath);
        dbSize = stats.size / (1024 * 1024); // Convert to MB
      } catch (error) {
        // Database file might not exist
      }

      // Calculate uptime
      const uptimeSeconds = os.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      return {
        cpu: {
          usage: currentLoad.currentLoad,
          cores: cpuInfo.cores,
          model: cpuInfo.brand
        },
        memory: {
          total: memInfo.total / (1024 * 1024 * 1024), // Convert to GB
          used: memInfo.used / (1024 * 1024 * 1024),
          free: memInfo.free / (1024 * 1024 * 1024),
          unit: 'GB'
        },
        disk: {
          total: mainDisk.size / (1024 * 1024 * 1024), // Convert to GB
          used: mainDisk.used / (1024 * 1024 * 1024),
          free: mainDisk.available / (1024 * 1024 * 1024),
          unit: 'GB'
        },
        network: {
          ip: this.getLocalIP(networkInterfaces),
          connections: networkConnections.length,
          interfaces: networkInterfaces.map(iface => ({
            name: iface.iface,
            ip4: iface.ip4,
            ip6: iface.ip6,
            mac: iface.mac
          }))
        },
        database: {
          size: dbSize,
          tables: 5, // Static for now - could query actual table count
          unit: 'MB'
        },
        uptime,
        platform: os.platform(),
        hostname: os.hostname(),
        nodeVersion: process.version
      };
    } catch (error) {
      console.error('Failed to get system info:', error);
      throw error;
    }
  }

  private getLocalIP(interfaces: any[]): string {
    for (const iface of interfaces) {
      if (iface.ip4 && !iface.internal) {
        return iface.ip4;
      }
    }
    return '127.0.0.1';
  }

  async getResourceUsage(): Promise<{
    cpu: number;
    memory: { used: number; total: number };
  }> {
    const currentLoad = await si.currentLoad();
    const memInfo = await si.mem();

    return {
      cpu: currentLoad.currentLoad,
      memory: {
        used: memInfo.used / (1024 * 1024 * 1024),
        total: memInfo.total / (1024 * 1024 * 1024)
      }
    };
  }
}