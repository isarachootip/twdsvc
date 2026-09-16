import { describe, it, expect } from 'vitest';
import { satangToBaht, bahtToSatang, roundHalfUp, formatBaht, formatThaiDate } from './money';

describe('Money and Formatting Rules', () => {
  it('should convert Satang to Baht accurately', () => {
    expect(satangToBaht(15000)).toBe(150);
    expect(satangToBaht(123456)).toBe(1234.56);
    expect(satangToBaht(0)).toBe(0);
  });

  it('should convert Baht to Satang using roundHalfUp', () => {
    expect(bahtToSatang(150)).toBe(15000);
    expect(bahtToSatang(1234.56)).toBe(123456);
    expect(bahtToSatang(1234.564)).toBe(123456);
    expect(bahtToSatang(1234.565)).toBe(123457);
  });

  it('should perform roundHalfUp correctly for positive and negative numbers', () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(2.49)).toBe(2);
    expect(roundHalfUp(2.51)).toBe(3);
    expect(roundHalfUp(-2.5)).toBe(-3);
    expect(roundHalfUp(-2.49)).toBe(-2);
  });

  it('should format Baht currency correctly', () => {
    expect(formatBaht(15000)).toBe('฿150');
    expect(formatBaht(123450)).toBe('฿1,234.50');
    expect(formatBaht(123400, { showDecimals: true })).toBe('฿1,234.00');
    expect(formatBaht(123400, { includeSymbol: false })).toBe('1,234');
  });

  it('should format Thai date in Buddhist Era (พ.ศ.) with Bangkok timezone', () => {
    const d = new Date('2026-09-16T10:30:00.000Z'); // 17:30 in Bangkok
    const formattedShort = formatThaiDate(d, { shortMonth: true });
    expect(formattedShort).toBe('16 ก.ย. 2569');

    const formattedFull = formatThaiDate(d, { shortMonth: false });
    expect(formattedFull).toBe('16 กันยายน 2569');

    const formattedTime = formatThaiDate(d, { showTime: true });
    expect(formattedTime).toBe('16 ก.ย. 2569 17:30 น.');
  });
});
