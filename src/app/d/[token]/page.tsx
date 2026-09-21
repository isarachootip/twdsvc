'use client'

import { useState, useEffect, use } from 'react'
import {
  Calendar, Clock, MapPin, Truck, CheckCircle2,
  Store, Home, AlertCircle, Camera, ShieldCheck
} from 'lucide-react'

interface DeliveryData {
  jobNo: string
  productName: string
  brandName: string
  customerName: string | null
  customerPhone: string | null
  customerAddress: string | null
  branchName: string
  branchPhone: string | null
  branchAddress: string | null
  stage: string
  isDriver: boolean
  legInfo: {
    legType: string
    origin: string
    destination: string
    status: string
  }
  shipment?: {
    legType: string
    carrier: string
    trackingNo?: string | null
    status: string
  } | null
  canConfirmPickup?: boolean
  appointment?: {
    deliveryType: string
    appointmentDate: string
    timeSlot: string
    address?: string
  } | null
}

const TIME_SLOTS = [
  '09:00 - 12:00 (ช่วงเช้า)',
  '13:00 - 16:00 (ช่วงบ่าย)',
  '16:00 - 19:00 (ช่วงเย็น)',
]

export default function DeliverySchedulingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Customer Delivery Scheduling State
  const [deliveryType, setDeliveryType] = useState<'BRANCH_PICKUP' | 'HOME_DELIVERY'>('BRANCH_PICKUP')
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0])
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  // Carrier Driver Photo State
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [driverPhoto, setDriverPhoto] = useState<string | null>(null)
  const [driverConfirmed, setDriverConfirmed] = useState(false)

  const loadData = () => {
    fetch(`/api/public/d/${token}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? 'ไม่พบข้อมูลการนัดหมาย หรือลิงก์หมดอายุ')
        return j
      })
      .then((d: DeliveryData) => {
        setData(d)
        if (d.customerAddress) setAddress(d.customerAddress)
        if (d.appointment) {
          setDeliveryType(d.appointment.deliveryType as 'BRANCH_PICKUP' | 'HOME_DELIVERY')
          setAppointmentDate(d.appointment.appointmentDate)
          setTimeSlot(d.appointment.timeSlot)
          if (d.appointment.address) setAddress(d.appointment.address)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/d/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryType,
          appointmentDate,
          timeSlot,
          address: deliveryType === 'HOME_DELIVERY' ? address : undefined,
          note,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'ไม่สามารถบันทึกการนัดหมายได้')
      setSuccessMsg('บันทึกการนัดหมายรับสินค้าเรียบร้อยแล้ว')
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadDriverPhoto = async (file: File | undefined) => {
    if (!file) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/public/d/${token}/photo`, {
        method: 'POST',
        body: fd,
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'อัปโหลดภาพไม่สำเร็จ')
      setDriverPhoto(j.fileUrl)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการอัปโหลด')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDriverConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/d/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: driverPhoto ? [driverPhoto] : [],
          carrierConfirm: true,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'ยืนยันรับพัสดุไม่สำเร็จ')
      setDriverConfirmed(true)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#6B6459]">กำลังโหลดข้อมูลการจัดส่ง...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E4DED2] max-w-sm w-full text-center space-y-3">
          <AlertCircle size={44} className="text-[#C8102E] mx-auto" />
          <h2 className="font-bold text-[#2B2723] text-base">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
          <p className="text-xs text-[#6B6459]">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3EEE6] font-sans pb-12">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF7F2] shadow-sm flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="bg-[#C8102E] text-white py-5 px-6 text-center shadow-md">
            <h1 className="text-base font-semibold tracking-wide">ศูนย์บริการซ่อมไทวัสดุ</h1>
            <p className="text-xs opacity-90 mt-0.5 font-light">
              {data.isDriver ? 'ใบนำส่งพัสดุสำหรับคนรถ (Driver Sheet)' : 'นัดหมายรับสินค้า / จัดส่ง'}
            </p>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Job summary card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">เลขที่งาน:</span>
                <span className="font-mono font-bold text-[#2B2723] text-sm">{data.jobNo}</span>
              </div>
              <div className="flex justify-between border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">สินค้า:</span>
                <span className="font-medium text-[#2B2723]">{data.productName} ({data.brandName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6459]">สาขา:</span>
                <span className="text-[#2B2723]">{data.branchName}</span>
              </div>
            </div>

            {/* Route Leg & Shipment Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#2B2723] border-b border-[#E4DED2] pb-2">
                <Truck size={16} className="text-[#C8102E]" />
                <span>เส้นทางการเดินรถ / ขนส่ง (Leg Type: {data.legInfo.legType})</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-[#6B6459]">ต้นทาง (Origin):</span>
                  <span className="font-semibold text-[#2B2723] text-right">{data.legInfo.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6459]">ปลายทาง (Destination):</span>
                  <span className="font-semibold text-[#185FA5] text-right">{data.legInfo.destination}</span>
                </div>
                <div className="flex justify-between border-t border-[#F3EEE6] pt-1.5">
                  <span className="text-[#6B6459]">สถานะพัสดุ:</span>
                  <span className="font-medium text-[#1D9E75]">{data.legInfo.status}</span>
                </div>
                {data.shipment?.trackingNo && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6459]">เลขพัสดุขนส่ง:</span>
                    <span className="font-mono font-semibold text-[#2B2723]">{data.shipment.trackingNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Carrier Driver Confirmation View */}
            {data.isDriver ? (
              <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-[#2B2723]">ยืนยันการรับพัสดุขึ้นรถ</h3>

                {driverConfirmed ? (
                  <div className="bg-[#E1F5EE] border border-[#1D9E75] p-4 rounded-xl text-center space-y-2">
                    <CheckCircle2 size={32} className="text-[#1D9E75] mx-auto" />
                    <h4 className="font-bold text-sm text-[#1D9E75]">ยืนยันรับพัสดุเรียบร้อย</h4>
                    <p className="text-xs text-[#2B2723]">ระบบได้บันทึกสถานะขึ้นรถจัดส่งแล้ว</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block w-full py-3 px-4 border-2 border-dashed border-[#D2C9B8] rounded-xl text-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <Camera size={24} className="mx-auto text-[#6B6459] mb-1" />
                      <span className="text-xs font-semibold text-[#2B2723]">
                        {uploadingPhoto ? 'กำลังอัปโหลดรูป...' : driverPhoto ? '✓ ถ่ายรูปแล้ว (แตะเพื่อถ่ายใหม่)' : 'ถ่ายภาพสินค้าเพื่อยืนยัน'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleUploadDriverPhoto(e.target.files?.[0])}
                      />
                    </label>

                    {driverPhoto && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#D2C9B8] mx-auto">
                        <img src={driverPhoto} alt="ยืนยันรับพัสดุ" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleDriverConfirm}
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl bg-[#1D9E75] text-white font-bold text-sm shadow hover:opacity-95 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={18} />
                      {submitting ? 'กำลังบันทึก...' : 'ยืนยันรับพัสดุขึ้นรถแล้ว'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Customer Delivery Scheduling Form */
              <form onSubmit={handleSubmitSchedule} className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-4">
                <h3 className="font-bold text-xs text-[#2B2723]">เลือกรูปแบบการรับสินค้า</h3>

                {successMsg && (
                  <div className="bg-[#E1F5EE] border border-[#1D9E75] p-3 rounded-xl flex items-center gap-2 text-xs text-[#1D9E75]">
                    <CheckCircle2 size={18} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Option Tabs: Branch Pickup vs Home Delivery */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('BRANCH_PICKUP')}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 border-2 transition-all ${
                      deliveryType === 'BRANCH_PICKUP'
                        ? 'border-[#C8102E] bg-[#FBE7E9] text-[#9C0C22]'
                        : 'border-[#E4DED2] bg-white text-[#6B6459]'
                    }`}
                  >
                    <Store size={20} />
                    <span>รับที่สาขา</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('HOME_DELIVERY')}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 border-2 transition-all ${
                      deliveryType === 'HOME_DELIVERY'
                        ? 'border-[#C8102E] bg-[#FBE7E9] text-[#9C0C22]'
                        : 'border-[#E4DED2] bg-white text-[#6B6459]'
                    }`}
                  >
                    <Home size={20} />
                    <span>จัดส่งถึงบ้าน</span>
                  </button>
                </div>

                {deliveryType === 'BRANCH_PICKUP' ? (
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E4DED2] text-xs space-y-1">
                    <div className="font-bold text-[#2B2723]">สถานที่รับสินค้า</div>
                    <div className="text-[#6B6459]">{data.branchName}</div>
                    {data.branchAddress && <div className="text-[11px] text-[#9A9384]">{data.branchAddress}</div>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#6B6459]">ที่อยู่จัดส่ง</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="บ้านเลขที่, หมู่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด..."
                      rows={2}
                      className="w-full p-2.5 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E]"
                      required
                    />
                  </div>
                )}

                {/* Date Picker */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#6B6459] flex items-center gap-1">
                    <Calendar size={13} /> วันที่นัดหมาย
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full p-2.5 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E]"
                    required
                  />
                </div>

                {/* Time Slot Picker */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#6B6459] flex items-center gap-1">
                    <Clock size={13} /> ช่วงเวลา
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full p-2.5 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E] bg-white"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#6B6459]">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น ฝากไว้ที่ป้อมยาม, โทรแจ้งก่อน 30 นาที"
                    className="w-full p-2.5 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm shadow hover:bg-[#9C0C22] transition-colors disabled:opacity-60"
                >
                  {submitting ? 'กำลังบันทึก...' : 'ยืนยันการนัดหมายรับสินค้า'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-[#9A9384] py-4 border-t border-[#E4DED2] bg-[#FAF7F2]">
          ศูนย์บริการซ่อมไทวัสดุ · สาขา {data.branchName}
        </div>
      </div>
    </div>
  )
}
