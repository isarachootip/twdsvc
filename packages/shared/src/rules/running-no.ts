/**
 * Running number generator and formatter.
 * Reference: docs/05_business_rules.md §5
 * Formats: {PREFIX}-{YY}{MM}-{SEQ} (e.g. JB-2609-08231) using Asia/Bangkok time.
 */

export type RunningNoPrefix = 'JB' | 'STK' | 'TI' | 'QT';

/**
 * Extracts 2-digit Year and 2-digit Month (YYMM) in Asia/Bangkok timezone.
 */
export function getBangkokYYMM(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: '2-digit',
    month: '2-digit',
  });

  const parts = formatter.formatToParts(d);
  let yy = '';
  let mm = '';
  for (const p of parts) {
    if (p.type === 'year') yy = p.value;
    if (p.type === 'month') mm = p.value;
  }

  return `${yy}${mm}`;
}

/**
 * Formats running number with given prefix, date, and sequence number.
 * Example: formatRunningNo('JB', new Date('2026-09-16'), 8231) -> "JB-2609-08231"
 */
export function formatRunningNo(
  prefix: RunningNoPrefix,
  date: Date | string,
  seq: number
): string {
  const yymm = getBangkokYYMM(date);
  const seqPadded = seq.toString().padStart(5, '0');
  return `${prefix}-${yymm}-${seqPadded}`;
}
