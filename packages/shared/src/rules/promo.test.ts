import { describe, it, expect } from 'vitest';
import { bestPromotion, PromotionCandidate } from './promo';

describe('Promotion Rules (docs/05_business_rules.md §6.1)', () => {
  const samplePromos: PromotionCandidate[] = [
    {
      id: 'promo-01',
      name: 'โปรทั่วไป',
      tradeInType: 'TYPE1_WALK_IN',
      sizeCategoryId: 'sz_small',
      percent: 10.0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01T08:00:00.000Z'),
    },
    {
      id: 'promo-02',
      name: 'โปรทั่วไปใหญ่',
      tradeInType: 'TYPE1_WALK_IN',
      sizeCategoryId: 'sz_large',
      percent: 8.0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01T08:00:00.000Z'),
    },
    {
      id: 'promo-03',
      name: 'โปรปีใหม่',
      tradeInType: 'TYPE2_BACKOFFICE',
      sizeCategoryId: 'sz_large',
      percent: 15.0,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2027-01-15'),
      status: 'ACTIVE',
      createdAt: new Date('2026-08-20T10:00:00.000Z'),
    },
    {
      id: 'promo-04',
      name: 'โปรลูกค้าเก่า',
      tradeInType: 'TYPE2_BACKOFFICE',
      sizeCategoryId: 'sz_large',
      percent: 15.0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-10-31'),
      status: 'ACTIVE',
      createdAt: new Date('2026-09-05T14:30:00.000Z'),
    },
  ];

  const targetDate = new Date('2026-09-12T10:00:00.000Z');

  it('Case 1: T2 + LARGE on 2026-09-12 -> selects "โปรลูกค้าเก่า" (15% with latest createdAt)', () => {
    const promo = bestPromotion(samplePromos, {
      type: 'TYPE2_BACKOFFICE',
      sizeCategoryId: 'sz_large',
      date: targetDate,
    });

    expect(promo).not.toBeNull();
    expect(promo?.id).toBe('promo-04');
    expect(promo?.name).toBe('โปรลูกค้าเก่า');
    expect(promo?.percent).toBe(15.0);
  });

  it('Case 2: T1 + SMALL on 2026-09-12 -> selects "โปรทั่วไป" (10%)', () => {
    const promo = bestPromotion(samplePromos, {
      type: 'TYPE1_WALK_IN',
      sizeCategoryId: 'sz_small',
      date: targetDate,
    });

    expect(promo).not.toBeNull();
    expect(promo?.id).toBe('promo-01');
    expect(promo?.name).toBe('โปรทั่วไป');
    expect(promo?.percent).toBe(10.0);
  });

  it('Case 3: T1 + LARGE on 2026-09-12 -> selects "โปรทั่วไปใหญ่" (8%)', () => {
    const promo = bestPromotion(samplePromos, {
      type: 'TYPE1_WALK_IN',
      sizeCategoryId: 'sz_large',
      date: targetDate,
    });

    expect(promo).not.toBeNull();
    expect(promo?.id).toBe('promo-02');
    expect(promo?.name).toBe('โปรทั่วไปใหญ่');
    expect(promo?.percent).toBe(8.0);
  });

  it('Case 4: T2 + SMALL on 2026-09-12 -> returns null (no matching active promo)', () => {
    const promo = bestPromotion(samplePromos, {
      type: 'TYPE2_BACKOFFICE',
      sizeCategoryId: 'sz_small',
      date: targetDate,
    });

    expect(promo).toBeNull();
  });

  it('should ignore INACTIVE and expired promotions', () => {
    const inactivePromos: PromotionCandidate[] = [
      {
        ...samplePromos[0],
        status: 'INACTIVE',
      },
    ];

    const res = bestPromotion(inactivePromos, {
      type: 'TYPE1_WALK_IN',
      sizeCategoryId: 'sz_small',
      date: targetDate,
    });

    expect(res).toBeNull();
  });
});
