'use client'

import Modal from '@/components/ui/Modal'
import { fmtDateTime } from '@/lib/constants'
import { LON_TYPE_LABELS } from '@/lib/validations/lon.schema'
import type { LonMonitorLogItem, RemoteLonRecord } from '@/lib/services/lon-monitor.service'

export function LonPayloadInspectModal({
  item,
  onClose,
  onRetry,
  retrying,
}: {
  item: LonMonitorLogItem | null
  onClose: () => void
  onRetry: (item: LonMonitorLogItem) => void
  retrying: boolean
}) {
  if (!item) return null

  return (
    <Modal open onClose={onClose}>
      <h3 style={{ marginTop: 0, marginBottom: 10 }}>รายละเอียดการส่ง API LON — {item.jobNo}</h3>
      <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
        <div className="grid2" style={{ gap: 8 }}>
          <div>
            <span className="sub-mute">ประเภทการแจ้งเตือน:</span>
            <div style={{ fontWeight: 600 }}>{LON_TYPE_LABELS[item.type]}</div>
          </div>
          <div>
            <span className="sub-mute">วัน-เวลาที่ยิง:</span>
            <div style={{ fontWeight: 500 }}>{fmtDateTime(item.createdAt)} · โดย {item.triggeredBy ?? 'AUTO'}</div>
          </div>
          <div>
            <span className="sub-mute">ลูกค้า / เบอร์ผู้รับ:</span>
            <div style={{ fontWeight: 500 }}>{item.customerName ?? '-'} ({item.recipientPhone})</div>
          </div>
          <div>
            <span className="sub-mute">Endpoint / HTTP Status:</span>
            <div className="font-mono" style={{ fontSize: 12 }}>
              POST {item.endpoint} {item.httpStatus ? `→ HTTP ${item.httpStatus}` : `(${item.status})`}
            </div>
          </div>
        </div>

        {item.errorMessage && (
          <div className="text-rose-600" style={{ fontSize: 12.5, fontWeight: 500 }}>
            ข้อผิดพลาด: {item.errorMessage}
          </div>
        )}

        <div>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Request Payload (JSON ที่ส่งออก):</div>
          <pre
            className="font-mono"
            style={{
              margin: 0,
              padding: 10,
              background: 'var(--surface-2)',
              borderRadius: 8,
              fontSize: 11.5,
              maxHeight: 240,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {JSON.stringify(item.requestPayload, null, 2)}
          </pre>
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Response Body (ข้อความตอบกลับจาก LON):</div>
          <pre
            className="font-mono"
            style={{
              margin: 0,
              padding: 10,
              background: 'var(--surface-2)',
              borderRadius: 8,
              fontSize: 11.5,
              maxHeight: 160,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {item.responseBody || '— ไม่มีข้อมูลตอบกลับ —'}
          </pre>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <button type="button" className="btn btn-primary" disabled={retrying} onClick={() => onRetry(item)}>
            {retrying ? 'กำลังยิงซ้ำ…' : 'ยิง API ซ้ำอีกครั้ง (Retry)'}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function LonRemoteReportModal({
  open,
  onClose,
  loading,
  error,
  total,
  records,
}: {
  open: boolean
  onClose: () => void
  loading: boolean
  error?: string
  total: number
  records: RemoteLonRecord[]
}) {
  if (!open) return null

  return (
    <Modal open onClose={onClose} size="wide">
      <h3 style={{ marginTop: 0, marginBottom: 10 }}>
        ข้อมูลบนเซิร์ฟเวอร์ LON (lon.thaiwatsadu.com) — พบ {total} รายการ
      </h3>
      {loading ? (
        <p className="sub-mute">กำลังดึงข้อมูลจาก https://lon.thaiwatsadu.com/admin/svc_report_perpage …</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : records.length === 0 ? (
        <p className="sub-mute">ไม่พบรายการบนเซิร์ฟเวอร์ LON ตามเงื่อนไขที่ค้นหา</p>
      ) : (
        <div className="table-wrap" style={{ maxHeight: 420, overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขใบงาน (repair_no)</th>
                <th>ลูกค้า / เบอร์โทร</th>
                <th>สาขา (store_name)</th>
                <th>สินค้า / อาการ</th>
                <th>สถานะ (status)</th>
                <th>สถานะ LINE (line_status)</th>
                <th>อัปเดตล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{r.repair_no}</td>
                  <td>
                    <div>{r.customer_name}</div>
                    <div className="sub-mute font-mono" style={{ fontSize: 11.5 }}>{r.customer_phone}</div>
                  </td>
                  <td>{r.store_name ?? '-'}</td>
                  <td>
                    <div>{r.product_name ?? '-'}</div>
                    <div className="sub-mute" style={{ fontSize: 11.5 }}>{r.repair_reason ?? '-'}</div>
                  </td>
                  <td className="text-slate-700 font-medium">{r.status ?? '-'}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      {r.line_status ?? '-'}
                    </span>
                  </td>
                  <td className="sub-mute" style={{ fontSize: 11.5 }}>
                    {r.updated_at ? fmtDateTime(r.updated_at) : r.repair_date ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
