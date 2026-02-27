import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function probeRocmSmi(): Promise<{
  vramUsedMB: number;
  vramFreeMB: number;
  temperatureC: number;
  utilizationPercent: number;
} | null> {
  try {
    const { stdout } = await execFileAsync('rocm-smi', [
      '--showmeminfo', 'vram',
      '--showtemp',
      '--showuse',
      '--csv'
    ], { timeout: 5000 });

    const lines = stdout.trim().split('\n');
    if (lines.length < 2) return null;

    const header = lines[0].toLowerCase();
    const cols = header.split(',').map(c => c.trim());

    // Find column indices by header name (format varies across ROCm versions)
    const totalIdx = cols.findIndex(c => c.includes('total') && c.includes('vram'));
    const usedIdx = cols.findIndex(c => c.includes('used') && c.includes('vram'));
    const tempIdx = cols.findIndex(c => c.includes('temperature') || c.includes('temp'));
    const utilIdx = cols.findIndex(c => c.includes('gpu use') || c.includes('utilization'));

    let bestGpu = null;
    let maxFree = -1;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());

      // VRAM from rocm-smi comes in bytes; convert to MB
      const totalBytes = totalIdx >= 0 ? parseInt(parts[totalIdx], 10) : 0;
      const usedBytes = usedIdx >= 0 ? parseInt(parts[usedIdx], 10) : 0;
      const totalMB = Math.floor(totalBytes / (1024 * 1024));
      const usedMB = Math.floor(usedBytes / (1024 * 1024));
      const freeMB = totalMB - usedMB;

      const temp = tempIdx >= 0 ? parseFloat(parts[tempIdx]) : 0;
      const util = utilIdx >= 0 ? parseFloat(parts[utilIdx]) : 0;

      if (!isNaN(freeMB) && freeMB > maxFree) {
        maxFree = freeMB;
        bestGpu = {
          vramUsedMB: usedMB,
          vramFreeMB: freeMB,
          temperatureC: Math.round(temp),
          utilizationPercent: Math.round(util)
        };
      }
    }

    return bestGpu;
  } catch {
    return null;
  }
}
