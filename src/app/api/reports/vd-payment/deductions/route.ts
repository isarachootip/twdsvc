import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getJsonSetting, setSetting } from '@/lib/settings'

interface Deduction {
  id: string
  vendorParentId: string
  jobNo?: string
  amount: number
  reason: string
  createdAt: string
  usedInBatch?: string | null
}

// POST { vendorParentId, amount, reason, jobNo? }
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['ADMIN'], req)
    const b = await req.json()
    const amount = Math.round(Number(b.amount))
    if (!b.vendorParentId) throw new HttpError(400, 'กรุณาเลือก VD')
    if (!(amount > 0)) throw new HttpError(400, 'จำนวนเงินต้องมากกว่า 0')
    if (!String(b.reason ?? '').trim()) throw new HttpError(400, 'กรุณาระบุเหตุผล')

    const list = (await getJsonSetting<Deduction[]>('VENDOR_DEDUCTIONS')) || []
    list.push({
      id: crypto.randomUUID(),
      vendorParentId: b.vendorParentId,
      jobNo: b.jobNo || undefined,
      amount,
      reason: `${String(b.reason).trim()} (โดย ${user.username})`,
      createdAt: new Date().toISOString(),
      usedInBatch: null,
    })
    await setSetting('VENDOR_DEDUCTIONS', JSON.stringify(list))
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    return handleError(e)
  }
}

// DELETE ?id=
export async function DELETE(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const id = new URL(req.url).searchParams.get('id')
    const list = (await getJsonSetting<Deduction[]>('VENDOR_DEDUCTIONS')) || []
    await setSetting(
      'VENDOR_DEDUCTIONS',
      JSON.stringify(list.filter(d => d.id !== id || d.usedInBatch))
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
