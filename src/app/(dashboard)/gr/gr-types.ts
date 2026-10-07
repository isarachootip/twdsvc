// props ร่วมของตารางในหน้า GR
import type { useQueue, useRowInputs } from '@/components/ui/useQueue'
import type { useSort } from '@/components/ui/Sortable'
import type { JobView } from '@/lib/job-view'

export type QueueRun = ReturnType<typeof useQueue>['run']
export type RowInputs = ReturnType<typeof useRowInputs>
export type JobSort = ReturnType<typeof useSort<JobView>>

/** context ต่อแถวที่ทุกตารางใช้ร่วมกัน */
export interface GrRowCtx {
  done: Record<string, string>
  inp: RowInputs
  readOnly: boolean
  busy: string | null
  rowCls: (j: JobView) => string
  onOpen: (id: string) => void
  run: QueueRun
}

export interface GrTableProps {
  ctx: GrRowCtx
  /** ผลจาก useSort (เก็บ state ไว้ที่ GrClient เพื่อให้การเรียงคงอยู่เมื่อสลับแท็บ) */
  s: JobSort
}
