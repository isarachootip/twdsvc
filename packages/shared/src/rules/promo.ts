/**
 * Trade-in promotion selection rules.
 * Reference: docs/05_business_rules.md §6.1
 */

export interface PromotionCandidate {
  id: string;
  name: string;
  tradeInType: 'TYPE1_WALK_IN' | 'TYPE2_BACKOFFICE';
  sizeCategoryId: string;
  subDept?: string | null;
  percent: number | string | { toNumber?: () => number };
  startDate: Date | string;
  endDate: Date | string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  createdAt: Date | string;
}

export interface BestPromotionInput {
  type: 'TYPE1_WALK_IN' | 'TYPE2_BACKOFFICE';
  sizeCategoryId: string;
  subDept?: string | null;
  date: Date | string;
}

function parsePercent(val: any): number {
  if (typeof val === 'number') return val;
  if (val && typeof val.toNumber === 'function') return val.toNumber();
  return parseFloat(String(val)) || 0;
}

function normalizeDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * Finds the best applicable active promotion for a Trade-in transaction.
 * Picks highest percent first, breaking ties with newest createdAt.
 */
export function bestPromotion(
  promos: PromotionCandidate[],
  input: BestPromotionInput
): PromotionCandidate | null {
  const targetDate = normalizeDate(input.date);

  const matched = promos.filter((p) => {
    if (p.status !== 'ACTIVE') return false;
    if (p.tradeInType !== input.type) return false;
    if (p.sizeCategoryId !== input.sizeCategoryId) return false;
    if (p.subDept != null && p.subDept !== input.subDept) return false;

    const start = normalizeDate(p.startDate);
    const end = normalizeDate(p.endDate);

    // Date comparison (inclusive of full end day)
    const targetTime = targetDate.getTime();
    const startTime = start.getTime();
    const endTime = new Date(end).setHours(23, 59, 59, 999);

    return targetTime >= startTime && targetTime <= endTime;
  });

  if (matched.length === 0) return null;

  matched.sort((a, b) => {
    const pctA = parsePercent(a.percent);
    const pctB = parsePercent(b.percent);
    if (pctB !== pctA) {
      return pctB - pctA; // Highest percent first
    }

    const createdA = normalizeDate(a.createdAt).getTime();
    const createdB = normalizeDate(b.createdAt).getTime();
    return createdB - createdA; // Newest first
  });

  return matched[0] ?? null;
}
