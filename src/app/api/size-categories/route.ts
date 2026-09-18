import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const cats = await prisma.sizeCategory.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(cats)
}
