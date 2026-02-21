import { probeNvidiaSmi } from './nvidiaSmiProbe.js';

export interface GpuProbeResult {
  vramFreeMB: number | null;
  temperatureC: number | null;
  utilizationPercent: number | null;
}

export async function getGpuProbe(probeType: 'auto' | 'nvidia-smi' | 'none' = 'auto'): Promise<GpuProbeResult> {
  if (probeType === 'none') {
    return { vramFreeMB: null, temperatureC: null, utilizationPercent: null };
  }

  if (probeType === 'auto' || probeType === 'nvidia-smi') {
    const nvidia = await probeNvidiaSmi();
    if (nvidia) {
      return {
        vramFreeMB: nvidia.vramFreeMB,
        temperatureC: nvidia.temperatureC,
        utilizationPercent: nvidia.utilizationPercent
      };
    }
  }

  return { vramFreeMB: null, temperatureC: null, utilizationPercent: null };
}
