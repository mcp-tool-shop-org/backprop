import { TokenBucket } from './token-bucket.js';
import { ResourceMonitor } from './resource-monitor.js';

export class Governor {
  constructor(
    private tokenBucket: TokenBucket,
    private monitor: ResourceMonitor,
    private maxParallel: number = 2,
    private minFreeRamGB: number = 4,
  ) {}

  async canStartRun(): Promise<{ allowed: boolean; reason?: string }> {
    if (!(await this.tokenBucket.acquire(1))) {
      return { allowed: false, reason: 'token bucket exhausted' };
    }

    const state = await this.monitor.getState();
    if (parseFloat(state.ramFreeGB) < this.minFreeRamGB) {
      return { allowed: false, reason: `low RAM (${state.ramFreeGB} GB free)` };
    }

    return { allowed: true };
  }
}
