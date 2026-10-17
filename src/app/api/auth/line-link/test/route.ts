import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { pushToUser } from '@/lib/line-push'
import { ROLE_LABELS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(undefined, req)
    const roleLabel = ROLE_LABELS[user.role] ?? user.role
    const message = [
      '🔔 ทดสอบการแจ้งเตือนจากระบบศูนย์บริการไทวัสดุ (VService)',
      `ผู้ใช้งาน: ${user.fullName} (${roleLabel})`,
      `เวลาทดสอบ: ${new Date().toLocaleString('th-TH')}`,
      '✅ บัญชี LINE ของคุณพร้อมรับการแจ้งเตือนงานซ่อมและ SLA แล้ว',
    ].join('\n')

    const result = await pushToUser(user.id, message)
    if (!result.success) {
      throw new HttpError(502, result.error ?? 'ส่งข้อความทดสอบเข้า LINE ไม่สำเร็จ')
    }
    return NextResponse.json({ ok: true, mode: result.mode })
  } catch (e) {
    return handleError(e)
  }
}
