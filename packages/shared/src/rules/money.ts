/**
 * Money and formatting utility functions.
 * All monetary values are processed in Satang (integer) to avoid floating-point issues.
 */

/**
 * Converts Satang (integer) to Baht (float).
 */
export function satangToBaht(satang: number): number {
  return satang / 100;
}

/**
 * Converts Baht to Satang (integer) using round half up.
 */
export function bahtToSatang(baht: number): number {
  return roundHalfUp(baht * 100);
}

/**
 * Standard round-half-up rounding for numbers.
 */
export function roundHalfUp(num: number): number {
  const sign = num < 0 ? -1 : 1;
  const abs = Math.abs(num);
  return sign * Math.round(abs);
}

/**
 * Formats satang into Thai Baht currency display.
 * Examples: 123400 satang -> "฿1,234" (or "฿1,234.00" if showDecimals)
 *           123450 satang -> "฿1,234.50"
 */
export function formatBaht(
  satang: number,
  options: {
    showDecimals?: boolean;
    includeSymbol?: boolean;
  } = {}
): string {
  const { showDecimals = false, includeSymbol = true } = options;
  const baht = satangToBaht(satang);

  const hasFraction = satang % 100 !== 0;
  const fractionDigits = showDecimals || hasFraction ? 2 : 0;

  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(baht);

  return includeSymbol ? `฿${formatted}` : formatted;
}

/**
 * Formats a Date into Thai Buddhist Era (พ.ศ.) string.
 */
export function formatThaiDate(
  date: Date | string,
  options: {
    showTime?: boolean;
    shortMonth?: boolean;
  } = {}
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { showTime = false, shortMonth = true } = options;

  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];

  const thaiMonthsFull = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  // Convert to Bangkok time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const day = parseInt(partMap.day, 10);
  const monthIdx = parseInt(partMap.month, 10) - 1;
  const ceYear = parseInt(partMap.year, 10);
  const beYear = ceYear + 543;

  const monthName = shortMonth ? thaiMonthsShort[monthIdx] : thaiMonthsFull[monthIdx];
  const dateStr = `${day} ${monthName} ${beYear}`;

  if (showTime) {
    const hour = partMap.hour.padStart(2, '0');
    const minute = partMap.minute.padStart(2, '0');
    return `${dateStr} ${hour}:${minute} น.`;
  }

  return dateStr;
}
