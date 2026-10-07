// หาปลายทางของงานหลังทำ action สำเร็จ — ใช้แสดงในข้อความ "JB-xxx: รับแล้ว → Pack สินค้า"
// pure function (ไม่ผูก React) เพื่อให้ unit test ได้
import { STAGE_LABELS, type Stage } from './constants'

export interface DestinationInput {
  jobId: string
  /** stage ใหม่ที่ action API ส่งกลับมา */
  stage: string | undefined
  /** tabs จาก /api/queues/:dept (มี alias key ปนอยู่) */
  tabs: Record<string, ReadonlyArray<{ id: string }>>
  /** tabKey → ชื่อแท็บ (เฉพาะ key หลัก ไม่มี alias) */
  labels: Record<string, string> | undefined
}

const isStage = (s: string): s is Stage => Object.prototype.hasOwnProperty.call(STAGE_LABELS, s)

/** งานยังอยู่ในหน้านี้ → ชื่อแท็บ, ย้ายออกไปแล้ว → ชื่อสถานะใหม่, ไม่ทราบ → null */
export function resolveDestination({ jobId, stage, tabs, labels }: DestinationInput): string | null {
  if (labels) {
    for (const [key, label] of Object.entries(labels)) {
      if (tabs[key]?.some(j => j.id === jobId)) return label
    }
  }
  return stage && isStage(stage) ? STAGE_LABELS[stage] : null
}
