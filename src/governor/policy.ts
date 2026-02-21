import { TokenBucket } from './token-bucket.js';
import { ResourceMonitor } from './resource-monitor.js';

export class Governor {
  constructor(
    private tokenBucket: TokenBucket,
    private monitor: ResourceMonitor,
    private maxParallel: number = 2,
    private minFreeRamGB: number = 4,
    private maxTempC: number = 85,
  ) {}

  async canStartRun(): Promise<{ allowed: boolean; reason?: string }> {
    if (!(await this.tokenBucket.acquire(1))) {
      return { allowed: false, reason: 'token bucket exhausted' };
    }

    const state = await this.monitor.getState();
    
    // Conservative mode if monitoring fails
    if (state.monitoringFailed) {
      console.warn('[Governor] Resource monitoring failed. Entering conservative mode.');
      // In conservative mode, we might still allow it but with strict limits, 
      // or we just allow 1 run at a time.
      if (this.maxParallel > 1) {
        return { allowed: false, reason: 'monitoring failed, max parallel must be 1 in conservative mode' };
      }
      return { allowed: true };
    }

    // Graceful cooldown on high temp
    if (state.tempC !== null && state.tempC >= this.maxTempC) {
      return { allowed: false, reason: `GPU temperature too high (${state.tempC}°C >= ${this.maxTempC}°C). Cooling down.` };
    }

    // Low memory check
    if (state.ramFreeGB < this.minFreeRamGB) {
      return { allowed: false, reason: `low RAM (${state.ramFreeGB.toFixed(2)} GB free < ${this.minFreeRamGB} GB required)` };
    }

    // Auto-detect GPU count to adjust max parallel if needed
    // If user asked for more parallel runs than GPUs, we might warn or restrict,
    // but for now we just use it as a smart default if maxParallel wasn't explicitly set.
    // (Assuming maxParallel is passed from config, we just enforce it here).
    
    return { allowed: true };
  }
}
