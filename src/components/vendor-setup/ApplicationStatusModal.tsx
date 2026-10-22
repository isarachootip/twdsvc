'use client'

import React, { useState } from 'react'
import { X, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface ApplicationStatusModalProps {
  open: boolean
  onClose: () => void
  initialAppNo?: string
}

export function ApplicationStatusModal({ open, onClose, initialAppNo }: ApplicationStatusModalProps) {
  const [appNo, setAppNo] = useState(initialAppNo || '')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    applicationNo: string
    storeName: string
    businessType: string
    status: string
    submittedAt: string
    reviewedAt: string | null
    adminNotes: string | null
  } | null>(null)

  if (!open) return null

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch('/api/vendors/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appNo: appNo.trim(), contact: contact.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถตรวจสอบสถานะได้')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">ตรวจสอบสถานะใบสมัครศูนย์บริการ</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCheck} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">เลขที่ใบสมัคร (SC Code) *</label>
            <input
              type="text"
              value={appNo}
              onChange={e => setAppNo(e.target.value.toUpperCase())}
              placeholder="เช่น SC26100001"
              required
              className="w-full h-10 px-3 border border-slate-300 rounded-lg font-mono text-sm bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ หรือ อีเมลผู้ประสานงาน *</label>
            <input
              type="text"
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="ระบุเบอร์โทรหรืออีเมลที่กรอกไว้ในใบสมัคร"
              required
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'กำลังตรวจสอบ…' : 'ค้นหาสถานะใบสมัคร'}</span>
          </button>

          {result && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">{result.applicationNo}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    result.status === 'APPROVED' ? 'bg-emerald-600' :
                    result.status === 'REJECTED' ? 'bg-rose-600' : 'bg-amber-500 animate-pulse'
                  }`} />
                  <span className={
                    result.status === 'APPROVED' ? 'text-emerald-700' :
                    result.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-700'
                  }>
                    {result.status === 'APPROVED' ? 'อนุมัติเข้าร่วมโครงการแล้ว' :
                     result.status === 'REJECTED' ? 'ไม่ผ่านการพิจารณา' : 'อยู่ระหว่างรอตรวจสอบเอกสาร'}
                  </span>
                </span>
              </div>

              <div className="text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                <div><strong>ชื่อกิจการ:</strong> {result.storeName} ({result.businessType})</div>
                <div><strong>วันที่ยื่นสมัคร:</strong> {new Date(result.submittedAt).toLocaleDateString('th-TH')}</div>
                {result.adminNotes && (
                  <div className="text-rose-700 pt-1">
                    <strong>ข้อความจากเจ้าหน้าที่:</strong> {result.adminNotes}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
