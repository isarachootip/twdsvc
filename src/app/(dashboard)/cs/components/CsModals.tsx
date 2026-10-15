'use client'

import JobDetailModal from '@/components/jobs/JobDetail'
import PaymentModal from '@/components/jobs/PaymentModal'
import CsCustomerSignModal from '@/components/jobs/CsCustomerSignModal'
import CsLocationModal from './CsLocationModal'
import CsReturnReceiptModal from './CsReturnReceiptModal'
import type { JobView } from '@/lib/job-view'
import type { ActionType } from '@/lib/state-machine/types'

interface CsModalsProps {
  role: string
  openId: string | null
  setOpenId: (id: string | null) => void
  pay: { job: JobView; kind: 'intake' | 'repair'; amount: number } | null
  setPay: (p: { job: JobView; kind: 'intake' | 'repair'; amount: number } | null) => void
  locJob: JobView | null
  setLocJob: (j: JobView | null) => void
  printJob: JobView | null
  setPrintJob: (j: JobView | null) => void
  signJob: JobView | null
  setSignJob: (j: JobView | null) => void
  onSignConfirm: (sig: string) => Promise<void>
  busy: string | null
  reload: () => void
  run: (job: JobView, action: string, input: Record<string, unknown>, label: string) => Promise<unknown>
}

export default function CsModals({
  role,
  openId,
  setOpenId,
  pay,
  setPay,
  locJob,
  setLocJob,
  printJob,
  setPrintJob,
  signJob,
  setSignJob,
  onSignConfirm,
  busy,
  reload,
  run,
}: CsModalsProps) {
  return (
    <>
      <PaymentModal
        job={pay?.job ?? null}
        kind={pay?.kind ?? 'repair'}
        amount={pay?.amount ?? 0}
        onClose={() => setPay(null)}
        onPaid={() => {
          setPay(null)
          reload()
        }}
      />
      <JobDetailModal
        jobId={openId}
        role={role}
        onClose={() => setOpenId(null)}
        onChanged={() => reload()}
      />
      <CsLocationModal
        job={locJob}
        onClose={() => setLocJob(null)}
        onUpdated={() => reload()}
        run={run}
        busy={busy}
      />
      <CsReturnReceiptModal
        job={printJob}
        onClose={() => setPrintJob(null)}
      />
      <CsCustomerSignModal
        open={!!signJob}
        onClose={() => setSignJob(null)}
        title={`ลงนามรับสินค้าคืน — ${signJob?.jobNo ?? ''}`}
        subtitle={`ลูกค้า: ${signJob?.customerName ?? ''}`}
        disclaimer="ข้าพเจ้าได้ตรวจรับสินค้าซ่อมเรียบร้อยแล้ว ถูกต้องครบถ้วนและอยู่ในสภาพสมบูรณ์"
        onConfirm={onSignConfirm}
      />
    </>
  )
}
