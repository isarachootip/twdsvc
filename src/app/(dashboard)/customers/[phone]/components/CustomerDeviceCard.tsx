import Link from 'next/link'
import { Wrench, AlertTriangle, Plus, Tag } from 'lucide-react'
import type { CustomerDevice } from '@/lib/validations/customer'
import DeviceRepairHistoryTable from './DeviceRepairHistoryTable'

interface Props {
  device: CustomerDevice
  phone: string
  canCreateJob: boolean
}

export default function CustomerDeviceCard({ device, phone, canCreateJob }: Props) {
  const isRepeated = device.repairCount > 1
  const newJobHref = `/cs/new?phone=${encodeURIComponent(phone)}&productName=${encodeURIComponent(device.productName)}&serialNo=${encodeURIComponent(device.serialNo ?? '')}`

  return (
    <div className="rounded-xl border bg-white overflow-hidden shadow-sm transition-all hover:shadow-md" style={{ borderColor: 'var(--border)' }}>
      {/* Device Header */}
      <div className="p-4 border-b bg-gray-50/50 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
            <Wrench size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-gray-900">{device.brandName}</span>
              <span className="text-sm text-gray-700">{device.productName}</span>
              {device.serialNo ? (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                  S/N: {device.serialNo}
                </span>
              ) : (
                <span className="text-xs text-gray-400 italic">
                  (ไม่มี S/N)
                </span>
              )}
            </div>
            {device.sku && (
              <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                <Tag size={11} />
                <span>SKU: {device.sku}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isRepeated ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle size={13} className="text-amber-600" />
              <span>ส่งซ่อมซ้ำ ({device.repairCount} ครั้ง)</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              ส่งซ่อม 1 ครั้ง
            </span>
          )}

          {canCreateJob && (
            <Link
              href={newJobHref}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              title="เปิดใบแจ้งซ่อมใหม่สำหรับสินค้ารายการนี้"
            >
              <Plus size={14} />
              <span>แจ้งซ่อมเครื่องนี้</span>
            </Link>
          )}
        </div>
      </div>

      {/* Repair History Table */}
      <DeviceRepairHistoryTable jobs={device.jobs} />
    </div>
  )
}
