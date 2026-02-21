import * as os from 'os';

export interface ResourceUsage {
  cpuPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  gpuMemoryUsedGb?: number;
  gpuMemoryTotalGb?: number;
}

export class ResourceMonitor {
  private lastCpuUsage: NodeJS.CpuUsage;
  private lastTime: number;

  constructor() {
    this.lastCpuUsage = process.cpuUsage();
    this.lastTime = Date.now();
  }

  public async getUsage(): Promise<ResourceUsage> {
    const now = Date.now();
    const currentCpuUsage = process.cpuUsage();
    
    const userDiff = currentCpuUsage.user - this.lastCpuUsage.user;
    const systemDiff = currentCpuUsage.system - this.lastCpuUsage.system;
    const timeDiff = now - this.lastTime;
    
    // CPU usage percentage (approximate)
    const cpuPercent = timeDiff > 0 
      ? ((userDiff + systemDiff) / 1000 / timeDiff) * 100 
      : 0;

    this.lastCpuUsage = currentCpuUsage;
    this.lastTime = now;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpuPercent: Math.min(100, Math.max(0, cpuPercent)),
      ramUsedGb: usedMem / (1024 ** 3),
      ramTotalGb: totalMem / (1024 ** 3),
      // GPU probe stub for now
      gpuMemoryUsedGb: 0,
      gpuMemoryTotalGb: 0,
    };
  }
}
