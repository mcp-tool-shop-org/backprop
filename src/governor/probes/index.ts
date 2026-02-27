import { probeNvidiaSmi } from './nvidiaSmiProbe.js';
import { probeRocmSmi } from './rocmProbe.js';

export interface GpuProbeResult {
  vramFreeMB: number | null;
  temperatureC: number | null;
  utilizationPercent: number | null;
}

export async function getGpuProbe(probeType: 'auto' | 'nvidia-smi' | 'rocm' | 'none' = 'auto'): Promise<GpuProbeResult> {
  if (probeType === 'none') {
    return { vramFreeMB: null, temperatureC: null, utilizationPercent: null };
  }

  if (probeType === 'rocm') {
    const rocm = await probeRocmSmi();
    if (rocm) {
      return {
        vramFreeMB: rocm.vramFreeMB,
        temperatureC: rocm.temperatureC,
        utilizationPercent: rocm.utilizationPercent
      };
    }
    return { vramFreeMB: null, temperatureC: null, utilizationPercent: null };
  }

  // 'auto' or 'nvidia-smi': try nvidia first
  const nvidia = await probeNvidiaSmi();
  if (nvidia) {
    return {
      vramFreeMB: nvidia.vramFreeMB,
      temperatureC: nvidia.temperatureC,
      utilizationPercent: nvidia.utilizationPercent
    };
  }

  // 'auto': fall back to rocm
  if (probeType === 'auto') {
    const rocm = await probeRocmSmi();
    if (rocm) {
      return {
        vramFreeMB: rocm.vramFreeMB,
        temperatureC: rocm.temperatureC,
        utilizationPercent: rocm.utilizationPercent
      };
    }
  }

  return { vramFreeMB: null, temperatureC: null, utilizationPercent: null };
}
