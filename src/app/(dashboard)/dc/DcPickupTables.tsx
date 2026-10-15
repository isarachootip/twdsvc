'use client'

import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import { Th, type SortState } from '@/components/ui/Sortable'
import type { LabelData } from '@/components/ui/PrintLabel'
import { buildLogisticsBoxLabel } from '@/lib/shipping-labels'
import type { JobView } from '@/lib/job-view'

function shipBadge(j: JobView, which: 'out' | 'in') {
  const s = which === 'out' ? j.outboundShipment : j.inboundShipment
  if (!s || s.status === 'PENDING_DISPATCH') return null
  return s
}

export function DcPickupTab({
  s1,
  done,
  readOnly,
  busy,
  rowCls,
  onOpenJob,
  onSetLabel,
  onDispatchDriver,
}: {
  s1: SortState<JobView>
  done: Record<string, string>
  readOnly: boolean
  busy: string | null
  rowCls: (j: JobView) => string
  onOpenJob: (id: string) => void
  onSetLabel: (d: LabelData) => void
  onDispatchDriver: (j: JobView, method: 'PRINT' | 'LINK', leg: 'GR_TO_DC' | 'DC_TO_BRANCH') => void
}) {
  if (s1.sorted.length === 0) return <EmptyCard />

  return (
    <div className="tcard">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s1} />
              <Th k="branch" label="สาขา" {...s1} />
              <Th k="customer" label="ลูกค้า" {...s1} />
              <Th k="product" label="สินค้า" {...s1} />
              <Th k="hours" label="รอมาแล้ว" {...s1} />
              <th>สถานะ / Action</th>
            </tr>
          </thead>
          <tbody>
            {s1.sorted.map(j => {
              const sh = shipBadge(j, 'out')
              const isDispatched = Boolean(sh || done[j.id])
              return (
                <tr key={j.id} className={rowCls(j)}>
                  <td><JobIdCell job={j} onOpen={() => onOpenJob(j.id)} showDate /></td>
                  <td>{j.branch.name}</td>
                  <td>{j.customerName ?? 'สต็อกสาขา'}</td>
                  <td>{j.productName}</td>
                  <td><SlaCell job={j} /></td>
                  <td>
                    {isDispatched ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          แจ้งคนรถแล้ว — รอ GR ส่งมอบ
                        </span>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => onSetLabel(buildLogisticsBoxLabel(j, 'GR_TO_DC'))}
                        >
                          🖨️ พิมพ์ใบปะหน้ากล่อง
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => onSetLabel(buildLogisticsBoxLabel(j, 'GR_TO_DC'))}
                        >
                          🖨️ พิมพ์ใบปะหน้ากล่อง
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={readOnly || busy !== null}
                          onClick={() => onDispatchDriver(j, 'PRINT', 'GR_TO_DC')}
                        >
                          แจ้งคนรถ + พิมพ์ใบปะหน้า
                        </button>
                        <button
                          type="button"
                          className="btn"
                          disabled={readOnly || busy !== null}
                          onClick={() => onDispatchDriver(j, 'LINK', 'GR_TO_DC')}
                        >
                          ส่ง Link ให้คนรถ
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function DcDispatchBranchTab({
  s5,
  done,
  readOnly,
  busy,
  rowCls,
  onOpenJob,
  onDispatchDriver,
  onConfirmDispatchBranch,
  onSetLabel,
}: {
  s5: SortState<JobView>
  done: Record<string, string>
  readOnly: boolean
  busy: string | null
  rowCls: (j: JobView) => string
  onOpenJob: (id: string) => void
  onDispatchDriver: (j: JobView, method: 'PRINT' | 'LINK', leg: 'GR_TO_DC' | 'DC_TO_BRANCH') => void
  onConfirmDispatchBranch: (j: JobView) => void
  onSetLabel: (d: LabelData) => void
}) {
  if (s5.sorted.length === 0) return <EmptyCard />

  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s5} /><Th k="branch" label="สาขาปลายทาง" {...s5} /><Th k="customer" label="ลูกค้า" {...s5} /><Th k="product" label="สินค้า" {...s5} /><Th k="hours" label="เวลาที่ค้าง" {...s5} /><th>สถานะ / Action</th></tr></thead>
      <tbody>{s5.sorted.map(j => {
        const sh = shipBadge(j, 'in')
        const dispatched = sh && j.inboundShipment?.legType === 'DC_TO_BRANCH'
        return (
          <tr key={j.id} className={rowCls(j)}>
            <td><JobIdCell job={j} onOpen={() => onOpenJob(j.id)} /></td><td>{j.branch.name}</td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td><td><SlaCell job={j} /></td>
            <td>{done[j.id] ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  ส่งคืนกลับสาขาแล้ว — รอ GR รับที่สาขา
                </span>
                <button type="button" className="btn" onClick={() => onSetLabel(buildLogisticsBoxLabel(j, 'DC_TO_BRANCH'))}>
                  🖨️ พิมพ์ใบปะหน้ากล่อง
                </button>
              </div>
            ) : !dispatched ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onSetLabel(buildLogisticsBoxLabel(j, 'DC_TO_BRANCH'))}
                >
                  🖨️ พิมพ์ใบปะหน้ากล่อง
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={readOnly || busy !== null}
                  onClick={() => onDispatchDriver(j, 'PRINT', 'DC_TO_BRANCH')}
                >
                  แจ้งคนรถ + พิมพ์ใบปะหน้า
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={readOnly || busy !== null}
                  onClick={() => onDispatchDriver(j, 'LINK', 'DC_TO_BRANCH')}
                >
                  ส่ง Link ให้คนรถ
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onSetLabel(buildLogisticsBoxLabel(j, 'DC_TO_BRANCH'))}
                >
                  🖨️ พิมพ์ใบปะหน้ากล่อง
                </button>
                <button type="button" className="btn btn-primary" disabled={readOnly || busy !== null} onClick={() => onConfirmDispatchBranch(j)}>
                  ยืนยัน: จัดส่งออกจาก DC แล้ว
                </button>
              </div>
            )}</td>
          </tr>
        )
      })}</tbody>
    </table></div></div>
  )
}
