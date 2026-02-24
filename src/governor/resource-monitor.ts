import * as os from 'os';

export interface ResourceState {
  ramFreeGB: number;
  cpuLoad: number;
  monitoringFailed: boolean;
}

export class ResourceMonitor {
  async getState(): Promise<ResourceState> {
    try {
      const ramFreeGB = os.freemem() / 1024 ** 3;
      const cpuLoad = this.getCpuLoad();

      return {
        ramFreeGB,
        cpuLoad,
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

  private getCpuLoad(): number {
    if (process.platform !== 'win32') {
      return os.loadavg()[0];
    }
    // os.loadavg() returns [0,0,0] on Windows.
    // Approximate from cumulative CPU times instead.
    const cpus = os.cpus();
    let idle = 0, total = 0;
    for (const cpu of cpus) {
      const t = cpu.times;
      idle += t.idle;
      total += t.user + t.nice + t.sys + t.idle + t.irq;
    }
    return total > 0 ? (1 - idle / total) * cpus.length : 0;
  }
}
