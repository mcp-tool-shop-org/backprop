import { describe, it, expect } from 'vitest';
import { formatDuration, padRight, padLeft } from '../src/utils/format.js';

describe('Format utilities', () => {
  it('formatDuration should format seconds', () => {
    expect(formatDuration(0, 45000)).toBe('45s');
  });

  it('formatDuration should format minutes and seconds', () => {
    expect(formatDuration(0, 125000)).toBe('2m 5s');
  });

  it('formatDuration should format hours and minutes', () => {
    expect(formatDuration(0, 3661000)).toBe('1h 1m');
  });

  it('formatDuration should handle zero duration', () => {
    expect(formatDuration(1000, 1000)).toBe('0s');
  });

  it('padRight should pad correctly', () => {
    expect(padRight('hi', 5)).toBe('hi   ');
  });

  it('padRight should truncate if longer than width', () => {
    expect(padRight('hello world', 5)).toBe('hello');
  });

  it('padLeft should pad correctly', () => {
    expect(padLeft('42', 5)).toBe('   42');
  });

  it('padLeft should truncate if longer than width', () => {
    expect(padLeft('hello world', 5)).toBe('hello');
  });
});
