'use client'

import React, { useState } from 'react'
import { Search, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function VendorStatusPage() {
  const [appNo, setAppNo] = useState('')
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

  const handleSearch = async (e: React.FormEvent) => {
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
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: 'var(--bg, #F4F4F3)', fontFamily: "var(--font-sarabun), 'Sarabun', sans-serif" }}>
      <div className="max-w-md mx-auto space-y-5">
        <Link
          href="/vendor/register"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าสมัครสมาชิก
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h1 className="text-lg font-bold text-slate-900">ตรวจสอบสถานะใบสมัครศูนย์บริการ</h1>
            <p className="text-xs text-slate-500 mt-0.5">ระบุเลขที่ใบสมัคร SC และเบอร์โทร/อีเมลที่ใช้สมัคร</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-3.5 text-xs">
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
              <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ หรือ อีเมล *</label>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="เบอร์โทรหรืออีเมลที่กรอกในใบสมัคร"
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
              className="w-full h-10 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'กำลังค้นหา…' : 'ตรวจสอบสถานะ'}</span>
            </button>
          </form>

          {result && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
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
                    {result.status === 'APPROVED' ? 'อนุมัติแล้ว' :
                     result.status === 'REJECTED' ? 'ไม่ผ่านการพิจารณา' : 'อยู่ระหว่างรอตรวจสอบ'}
                  </span>
                </span>
              </div>

              <div className="text-slate-600 space-y-1 pt-1.5 border-t border-slate-200/60">
                <div><strong>ชื่อร้าน/บริษัท:</strong> {result.storeName}</div>
                <div><strong>วันที่ยื่นสมัคร:</strong> {new Date(result.submittedAt).toLocaleDateString('th-TH')}</div>
                {result.adminNotes && (
                  <div className="text-rose-700 pt-1">
                    <strong>หมายเหตุ:</strong> {result.adminNotes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
