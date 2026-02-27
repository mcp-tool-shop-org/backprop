import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenBucket } from '../src/governor/token-bucket.js';

describe('TokenBucket extended', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at full capacity', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    expect(await bucket.acquire(4)).toBe(true);
    expect(await bucket.acquire(1)).toBe(false);
  });

  it('does not exceed capacity on refill', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    // Don't use any tokens, advance time significantly
    vi.advanceTimersByTime(300000); // 5 minutes
    // Should still only have 4 (capped at capacity)
    expect(await bucket.acquire(4)).toBe(true);
    expect(await bucket.acquire(1)).toBe(false);
  });

  it('allows zero-cost acquisition', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    await bucket.acquire(4); // drain
    // Zero cost should succeed even with 0 tokens
    expect(await bucket.acquire(0)).toBe(true);
  });

  it('refills incrementally over time', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    await bucket.acquire(4); // drain all

    // 1 minute: 1 token
    vi.advanceTimersByTime(60000);
    expect(await bucket.acquire(1)).toBe(true);
    expect(await bucket.acquire(1)).toBe(false);

    // Another minute: 1 more token
    vi.advanceTimersByTime(60000);
    expect(await bucket.acquire(1)).toBe(true);
  });

  it('rejects acquisition that exceeds available tokens', async () => {
    const bucket = new TokenBucket(4, 1, 60000);
    await bucket.acquire(3); // 1 left
    expect(await bucket.acquire(2)).toBe(false);
    // But 1 should still work
    expect(await bucket.acquire(1)).toBe(true);
  });

  it('handles custom refill rate', async () => {
    const bucket = new TokenBucket(10, 2, 60000); // 2 tokens per minute
    await bucket.acquire(10); // drain all

    vi.advanceTimersByTime(60000); // 1 minute = 2 tokens
    expect(await bucket.acquire(2)).toBe(true);
    expect(await bucket.acquire(1)).toBe(false);
  });

  it('handles custom refill interval', async () => {
    const bucket = new TokenBucket(4, 1, 30000); // 1 token per 30 seconds
    await bucket.acquire(4); // drain

    vi.advanceTimersByTime(30000); // 30 seconds = 1 token
    expect(await bucket.acquire(1)).toBe(true);
    expect(await bucket.acquire(1)).toBe(false);
  });
});
