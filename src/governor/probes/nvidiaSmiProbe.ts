import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function probeNvidiaSmi(): Promise<{
  vramUsedMB: number;
  vramFreeMB: number;
  temperatureC: number;
  utilizationPercent: number;
} | null> {
  try {
    const { stdout } = await execFileAsync('nvidia-smi', [
      '--query-gpu=memory.used,memory.free,temperature.gpu,utilization.gpu',
      '--format=csv,noheader,nounits'
    ], { timeout: 3000 });

    const lines = stdout.trim().split('\n');
    if (lines.length === 0 || !lines[0]) {
      return null;
    }

    // For simplicity, we'll just take the first GPU or aggregate.
    // Let's take the first GPU for now, or the one with the most free VRAM.
    // The user's snippet just splits by ', ' which assumes 1 GPU.
    // Let's handle multiple GPUs by finding the one with the most free VRAM.
    let bestGpu = null;
    let maxFree = -1;

    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length >= 4) {
        const used = parseInt(parts[0], 10);
        const free = parseInt(parts[1], 10);
        const temp = parseInt(parts[2], 10);
        const util = parseInt(parts[3], 10);

        if (!isNaN(free) && free > maxFree) {
          maxFree = free;
          bestGpu = {
            vramUsedMB: used,
            vramFreeMB: free,
            temperatureC: temp,
            utilizationPercent: util
          };
        }
      }
    }

    return bestGpu;
  } catch {
    return null;
  }
}
