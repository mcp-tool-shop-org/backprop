import * as os from 'os';

export interface ResourceState {
  ramFreeGB: number;
  cpuLoad: number;
  monitoringFailed: boolean;
}

export class ResourceMonitor {
  async getState(): Promise<ResourceState> {
    try {
      const cpu = os.loadavg()[0]; // 1-min load average
      const ramFreeGB = os.freemem() / 1024 ** 3;

      return {
        ramFreeGB,
        cpuLoad: cpu,
        monitoringFailed: false,
      };
    } catch (e) {
      return {
        ramFreeGB: 0,
        cpuLoad: 999,
        monitoringFailed: true,
      };
    }
  }
}
