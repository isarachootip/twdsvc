'use client'

import React from 'react'
import { ExternalLink, Download, CheckCircle2 } from 'lucide-react'
import type { NormalizedVendorApplication } from '@/lib/vendor-application-types'
import { SectionCard, InfoItem } from './DetailFieldHelpers'

interface Section10DocsConfirmCardProps {
  s10: NormalizedVendorApplication['section10']
}

export function Section10DocsConfirmCard({ s10 }: Section10DocsConfirmCardProps) {
  const attachedCount = s10.documents.filter(d => Boolean(d.fileUrl)).length

  return (
    <SectionCard
      stepNo={10}
      title="เอกสารประกอบและการยืนยันความถูกต้อง"
      subtitle="ไฟล์เอกสารแนบตามกฎหมาย การยอมรับข้อตกลงโครงการ และผู้มีอำนาจลงนามรับรองข้อมูล"
    >
      {/* 10.1 เอกสารประกอบ */}
      <div className="space-y-2.5">
        <span className="font-bold text-slate-800 block">
          10.1 เอกสารประกอบ ({attachedCount}/{s10.documents.length} รายการ)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {s10.documents.map(doc => {
            const hasFile = Boolean(doc.fileUrl)
            return (
              <div
                key={doc.key}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="font-semibold text-slate-800 block truncate">{doc.label}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                      hasFile ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${hasFile ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                    {hasFile ? 'แนบไฟล์แล้ว' : 'ไม่ได้แนบไฟล์'}
                  </span>
                </div>

                {doc.fileUrl && (
                  <div className="flex items-center gap-2 no-print shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> เปิดดู
                    </a>
                    <a
                      href={doc.fileUrl}
                      download
                      className="btn btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> ดาวน์โหลด
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 10.2 ข้อตกลง */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <span className="font-bold text-slate-800 block">10.2 ข้อตกลงและความพร้อมก่อนเริ่มโครงการ</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {s10.agreements.map(item => (
            <div key={item.key} className="flex items-start gap-2">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  item.accepted ? 'text-emerald-600' : 'text-slate-300'
                }`}
              />
              <span className={item.accepted ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 10.3 ผู้ลงนามรับรอง */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        <InfoItem label="10.3 ชื่อ-นามสกุล ผู้มีอำนาจลงนาม" value={s10.signName} />
        <InfoItem label="ตำแหน่งผู้ลงนาม" value={s10.signPos} />
        {s10.signatureUrl ? (
          <div>
            <span className="block text-[11px] text-slate-500 mb-1">ลายเซ็นดิจิทัล</span>
            <div className="border border-slate-200 rounded-lg p-2 bg-white inline-block">
              <img src={s10.signatureUrl} alt="Digital Signature" className="h-14 object-contain" />
            </div>
          </div>
        ) : (
          <InfoItem
            label="รูปแบบการลงนาม"
            value="ยืนยันทางอิเล็กทรอนิกส์ (พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์)"
            highlightClass="text-emerald-700"
          />
        )}
      </div>
    </SectionCard>
  )
}
