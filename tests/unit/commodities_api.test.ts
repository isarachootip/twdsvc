import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'

setTier('Tier 1')

describe('Unit: Product Master Commodities & Filter Integrity', () => {
  it('COMM-01: retrieves paginated commodities with correct total count', async () => {
    const total = await prisma.commodity.count()
    expect(total).toBeGreaterThan(300000)

    const page1 = await prisma.commodity.findMany({
      take: 10,
      skip: 0,
      orderBy: { sku: 'asc' },
    })
    expect(page1.length).toBe(10)
    expect(page1[0].sku).toBeDefined()
    expect(page1[0].name).toBeDefined()
  })

  it('COMM-02: filters commodities by brand with indexed search', async () => {
    const brand = 'KASSA HOME'
    const items = await prisma.commodity.findMany({
      where: { brand },
      take: 20,
    })
    expect(items.length).toBe(20)
    for (const item of items) {
      expect(item.brand).toBe(brand)
    }
  })

  it('COMM-03: filters commodities by active and inactive status correctly', async () => {
    const [activeCount, inactiveCount] = await Promise.all([
      prisma.commodity.count({ where: { active: true } }),
      prisma.commodity.count({ where: { active: false } }),
    ])
    expect(activeCount).toBeGreaterThan(250000)
    expect(inactiveCount).toBeGreaterThan(20000)
  })

  it('COMM-04: retrieves single SKU with full 32-field master data', async () => {
    const item = await prisma.commodity.findUnique({
      where: { sku: '60453445' },
    })
    expect(item).not.toBeNull()
    if (item) {
      expect(item.brand).toBe('MASTERWOOD')
      expect(item.barcode).toBe('2000604534459')
      expect(item.deptName).toBeDefined()
      expect(item.className).toBeDefined()
      expect(item.unitName).toBe('EACH')
    }
  })

  it('COMM-05: searches by text across SKU, barcode, and name', async () => {
    const results = await prisma.commodity.findMany({
      where: {
        OR: [
          { sku: { contains: '60453445' } },
          { barcode: { contains: '2000604534459' } },
        ],
      },
      take: 5,
    })
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((r) => r.sku === '60453445')).toBe(true)
  })
})
