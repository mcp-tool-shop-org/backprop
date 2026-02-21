export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number = 4,
    private refillRate: number = 1,        // tokens per minute
    private refillIntervalMs: number = 60000
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(cost: number = 1): Promise<boolean> {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / this.refillIntervalMs;
    this.tokens = Math.min(this.capacity, this.tokens + Math.floor(elapsed * this.refillRate));
    this.lastRefill = now;
  }
}
