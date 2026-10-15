'use client'

import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import { Th, type SortState } from '@/components/ui/Sortable'
import type { LabelData } from '@/components/ui/PrintLabel'
import { buildLogisticsBoxLabel, type LogisticsLabelLeg } from '@/lib/shipping-labels'
import type { JobView } from '@/lib/job-view'

export const RECEIVE_TYPE: Record<string, string> = { DC: 'เข้ารับที่ DC', DSD: 'เข้ารับที่สาขา', TPL: 'รอ 3PL มาส่ง' }

function getReceiveLeg(j: JobView): LogisticsLabelLeg {
  return j.channel === 'DC' || j.stage === 'AT_DC_OUTBOUND' ? 'DC_TO_VD' : 'GR_TO_VD'
}

export function VdReceiveTab({
  s1,
  receiveRows,
  filter,
  setFilter,
  scan,
  setScan,
  onScan,
  done,
  readOnly,
  demo,
  busy,
  rowCls,
  onOpenJob,
  onSetLabel,
  onDispatchDriver,
  run,
}: {
  s1: SortState<JobView>
  receiveRows: JobView[]
  filter: string
  setFilter: (v: string) => void
  scan: string
  setScan: (v: string) => void
  onScan: (e: React.FormEvent) => void
  done: Record<string, string>
  readOnly: boolean
  demo: boolean
  busy: string | null
  rowCls: (j: JobView) => string
  onOpenJob: (id: string) => void
  onSetLabel: (d: LabelData) => void
  onDispatchDriver: (j: JobView, method: 'PRINT' | 'LINK', leg: LogisticsLabelLeg) => void
  run: (job: JobView, action: string, body?: Record<string, unknown>, doneLabel?: string, opts?: { silent?: boolean }) => Promise<Record<string, unknown> | null>
}) {
  const receiveCell = (j: JobView) => {
    const leg = getReceiveLeg(j)
    if (done[j.id]) {
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            {done[j.id]}
          </span>
          <button type="button" className="btn" onClick={() => onSetLabel(buildLogisticsBoxLabel(j, leg))}>
            🖨️ พิมพ์ใบปะหน้ากล่อง
          </button>
        </div>
      )
    }

    const ship = j.outboundShipment
    const shipPending = !ship || ship.status === 'PENDING_DISPATCH'
    if (j.channel === 'TPL') {
      if (j.stage === 'GR_PACKED') {
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="inline-flex items-center gap-1.5 text-sky-700 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Booked 3PL #{ship?.trackingNo} — รอ GR ส่งมอบ
            </span>
            <button type="button" className="btn" onClick={() => onSetLabel(buildLogisticsBoxLabel(j, 'GR_TO_VD', { trackingNo: ship?.trackingNo }))}>
              🖨️ พิมพ์ใบปะหน้ากล่อง
            </button>
          </div>
        )
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="inline-flex items-center gap-1.5 text-sky-700 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              รอ 3PL นำส่งถึงศูนย์บริการ
            </span>
            <button type="button" className="btn" onClick={() => onSetLabel(buildLogisticsBoxLabel(j, 'GR_TO_VD', { trackingNo: ship?.trackingNo }))}>
              🖨️ พิมพ์ใบปะหน้ากล่อง
            </button>
          </div>
          {demo && !readOnly && (
            <button className="btn btn-primary" disabled={busy !== null} onClick={() => run(j, 'tpl_delivered', { note: 'จำลอง API 3PL แจ้งส่งสำเร็จ' }, 'ส่งมอบช่างแล้ว')}>
              จำลอง: API 3PL แจ้งส่งสำเร็จ
            </button>
          )}
        </div>
      )
    }

    if (j.stage === 'AT_DC_OUTBOUND' || (j.stage === 'GR_PACKED' && j.channel === 'DSD')) {
      if (shipPending) {
        return (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={() => onSetLabel(buildLogisticsBoxLabel(j, leg))}>
              🖨️ พิมพ์ใบปะหน้ากล่อง
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={readOnly || busy !== null}
              onClick={() => onDispatchDriver(j, 'PRINT', leg)}
            >
              ส่งรถเข้ารับ + พิมพ์ใบปะหน้า
            </button>
            <button
              type="button"
              className="btn"
              disabled={readOnly || busy !== null}
              onClick={() => onDispatchDriver(j, 'LINK', leg)}
            >
              ส่ง Link ให้คนรถ
            </button>
          </div>
        )
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              ส่งรถเข้ารับแล้ว — รอรับของ
            </span>
            <button type="button" className="btn" onClick={() => onSetLabel(buildLogisticsBoxLabel(j, leg))}>
              🖨️ พิมพ์ใบปะหน้ากล่อง
            </button>
          </div>
          {j.channel === 'DSD' && (
            <button className="btn btn-primary" disabled={readOnly || busy !== null} onClick={() => run(j, 'carrier_confirm_pickup', {}, 'คนรถรับของแล้ว')}>
              คนรถยืนยันรับของ (ขึ้นรถ)
            </button>
          )}
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="inline-flex items-center gap-1.5 text-teal-700 font-semibold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            ขนส่ง VD รับแล้ว
          </span>
          <button type="button" className="btn" onClick={() => onSetLabel(buildLogisticsBoxLabel(j, leg))}>
            🖨️ พิมพ์ใบปะหน้ากล่อง
          </button>
        </div>
        <button className="btn btn-primary" disabled={readOnly || busy !== null} onClick={() => run(j, 'vd_receive', {}, 'ส่งมอบช่างแล้ว')}>
          ส่งมอบช่าง (ถึงศูนย์บริการ VD)
        </button>
      </div>
    )
  }

  return (
    <>
      <form className="filter-bar" onSubmit={onScan}>
        <select className="sel" value={filter} onChange={e => setFilter(e.target.value)}>
          {['ทั้งหมด', 'เข้ารับที่ DC', 'เข้ารับที่สาขา', 'รอ 3PL มาส่ง'].map(o => <option key={o}>{o}</option>)}
        </select>
        <input className="inp" style={{ flex: 1, minWidth: 280 }} value={scan} onChange={e => setScan(e.target.value)} disabled={readOnly} placeholder="Scan QR หรือคีย์เลขใบแจ้งซ่อม เพื่อยืนยันส่งมอบช่าง แล้วกด Enter" />
      </form>
      {receiveRows.length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s1} /><Th k="customer" label="ลูกค้า" {...s1} /><Th k="product" label="สินค้า" {...s1} /><Th k="branch" label="สาขาที่รับ" {...s1} />
            <Th k="channel" label="ประเภทรับเข้า" {...s1} /><Th k="warranty" label="ประกัน" {...s1} /><Th k="hours" label="รอมาแล้ว" {...s1} /><th>สถานะ / Action</th>
          </tr></thead>
          <tbody>{s1.sorted.map(j => (
            <tr key={j.id} className={rowCls(j)}>
              <td><JobIdCell job={j} onOpen={() => onOpenJob(j.id)} showDate /></td>
              <td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td><td>{j.branch.name}</td>
              <td><span className="text-sky-700 font-semibold text-xs">{RECEIVE_TYPE[j.channel ?? ''] ?? '-'}</span></td>
              <td>{j.type === 'STOCK' ? '-' : j.hasWarranty ? 'มีประกัน' : 'ไม่มีประกัน'}</td>
              <td><SlaCell job={j} /></td>
              <td>{receiveCell(j)}</td>
            </tr>
          ))}</tbody>
        </table></div></div>
      )}
    </>
  )
}
