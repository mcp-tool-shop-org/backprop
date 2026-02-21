import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ResourceState {
  ramFreeGB: number;
  cpuLoad: number;
  gpuCount: number;
  gpuVRAMFreeMB: number | null;
  tempC: number | null;
  monitoringFailed: boolean;
}

export class ResourceMonitor {
  async getState(): Promise<ResourceState> {
    try {
      const cpu = os.loadavg()[0]; // 1-min load average
      const ramFreeGB = os.freemem() / 1024 ** 3;
      
      const gpuInfo = await this.probeGpu();

      return {
        ramFreeGB,
        cpuLoad: cpu,
        gpuCount: gpuInfo.count,
        gpuVRAMFreeMB: gpuInfo.vramFreeMB,
        tempC: gpuInfo.tempC,
        monitoringFailed: false,
      };
    } catch (e) {
      return {
        ramFreeGB: 0,
        cpuLoad: 999,
        gpuCount: 0,
        gpuVRAMFreeMB: null,
        tempC: null,
        monitoringFailed: true,
      };
    }
  }

  private async probeGpu(): Promise<{ count: number; vramFreeMB: number | null; tempC: number | null }> {
    try {
      // Try nvidia-smi
      const { stdout } = await execAsync('nvidia-smi --query-gpu=memory.free,temperature.gpu --format=csv,noheader,nounits');
      const lines = stdout.trim().split('\n');
      if (lines.length === 0 || !lines[0]) {
        return { count: 0, vramFreeMB: null, tempC: null };
      }
      
      let minVram = Infinity;
      let maxTemp = -Infinity;
      
      for (const line of lines) {
        const [vramStr, tempStr] = line.split(',').map(s => s.trim());
        const vram = parseInt(vramStr, 10);
        const temp = parseInt(tempStr, 10);
        
        if (!isNaN(vram) && vram < minVram) minVram = vram;
        if (!isNaN(temp) && temp > maxTemp) maxTemp = temp;
      }
      
      return {
        count: lines.length,
        vramFreeMB: minVram === Infinity ? null : minVram,
        tempC: maxTemp === -Infinity ? null : maxTemp,
      };
    } catch (e) {
      // No nvidia-smi or failed
      return { count: 0, vramFreeMB: null, tempC: null };
    }
  }
}
