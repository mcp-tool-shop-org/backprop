import * as os from 'os';

export class ResourceMonitor {
  async getState() {
    const ram = process.memoryUsage();
    const cpu = os.loadavg()[0]; // 1-min load average

    return {
      ramFreeGB: (os.freemem() / 1024 ** 3).toFixed(2),
      cpuLoad: cpu.toFixed(2),
      gpuVRAMFreeMB: await this.probeGpuVRAM(), // best-effort
      tempC: await this.probeTemp(),            // best-effort
    };
  }

  private async probeGpuVRAM(): Promise<number | null> {
    // TODO: nvidia-smi / rocm-smi fallback
    return null; // safe default for MVP
  }

  private async probeTemp(): Promise<number | null> {
    return null;
  }
}
