import { describe, it, expect } from 'vitest';
import { formatRunningNo, getBangkokYYMM } from './running-no';

describe('Running Number Rules (docs/05_business_rules.md §5)', () => {
  it('should format running numbers for all prefixes with 5-digit padding', () => {
    const d = new Date('2026-09-16T12:00:00.000Z');

    expect(formatRunningNo('JB', d, 8231)).toBe('JB-2609-08231');
    expect(formatRunningNo('STK', d, 1032)).toBe('STK-2609-01032');
    expect(formatRunningNo('TI', d, 4181)).toBe('TI-2609-04181');
    expect(formatRunningNo('QT', d, 3001)).toBe('QT-2609-03001');
    expect(formatRunningNo('JB', d, 1)).toBe('JB-2609-00001');
  });

  it('should accurately handle Bangkok timezone midnight month rollover', () => {
    // 2026-09-30 23:59:59 in Bangkok (+07:00) is 2026-09-30 16:59:59 UTC
    const beforeMidnightUtc = new Date('2026-09-30T16:59:59.000Z');
    expect(getBangkokYYMM(beforeMidnightUtc)).toBe('2609');
    expect(formatRunningNo('JB', beforeMidnightUtc, 999)).toBe('JB-2609-00999');

    // 2026-10-01 00:00:01 in Bangkok (+07:00) is 2026-09-30 17:00:01 UTC
    const afterMidnightUtc = new Date('2026-09-30T17:00:01.000Z');
    expect(getBangkokYYMM(afterMidnightUtc)).toBe('2610');
    expect(formatRunningNo('JB', afterMidnightUtc, 1)).toBe('JB-2610-00001');
  });
});
