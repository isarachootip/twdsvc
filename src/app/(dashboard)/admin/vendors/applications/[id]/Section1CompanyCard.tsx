'use client'

import React from 'react'
import { fmtPhone } from '@/lib/constants'
import type { NormalizedVendorApplication, NormalizedAddress } from '@/lib/vendor-application-types'
import { SectionCard, InfoItem } from './DetailFieldHelpers'

function formatFullAddr(a: NormalizedAddress): string {
  const parts = [a.line1, a.subdistrict, a.district, a.province, a.zip].filter(p => p && p !== '-')
  return parts.length > 0 ? parts.join(' ') : '-'
}

interface Section1CompanyCardProps {
  s1: NormalizedVendorApplication['section1']
}

export function Section1CompanyCard({ s1 }: Section1CompanyCardProps) {
  return (
    <SectionCard
      stepNo={1}
      title="ข้อมูลบริษัท ศูนย์บริการ ผู้ติดต่อ และบัญชีธนาคาร"
      subtitle="ข้อมูลนิติบุคคล ที่ตั้งสำนักงานใหญ่ สาขาศูนย์บริการ ผู้ประสานงาน และบัญชีรับเงิน"
    >
      {/* 1.0 & 1.1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <InfoItem label="1.0 สถานะการลงทะเบียนกับไทวัสดุ" value={s1.supplierRegistered} />
        <InfoItem label="รหัสคู่ค้า (SPCODE)" value={s1.spcode} mono highlightClass="text-red-700" />
        <InfoItem label="1.1 ประเภทธุรกิจ" value={s1.entityType} />
        <InfoItem label="เลขประจำตัวผู้เสียภาษี (13 หลัก)" value={s1.taxId} mono />
        <div className="sm:col-span-2">
          <InfoItem label="ชื่อบริษัท / ร้านค้า / กิจการ" value={s1.storeName} />
        </div>
        <InfoItem label="เลขทะเบียนนิติบุคคล" value={s1.regNo} mono />
        <InfoItem
          label="1.4 สถานะศูนย์บริการแต่งตั้ง"
          value={s1.authorizedText}
          highlightClass={s1.isBrandAuthorized ? 'text-emerald-700' : 'text-slate-700'}
        />
      </div>

      {/* Authorized Brands if present */}
      {s1.authorizedBrands.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 font-semibold">แบรนด์ที่ได้รับแต่งตั้ง</th>
                <th className="py-2 px-3 font-semibold">ประเภทสินค้า</th>
                <th className="py-2 px-3 font-semibold">เลขที่ใบรับรอง</th>
                <th className="py-2 px-3 font-semibold">วันหมดอายุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s1.authorizedBrands.map((ab, i) => (
                <tr key={i}>
                  <td className="py-2 px-3 font-semibold text-slate-900">{ab.brand}</td>
                  <td className="py-2 px-3">{ab.productType}</td>
                  <td className="py-2 px-3 font-mono">{ab.certNo}</td>
                  <td className="py-2 px-3">{ab.expireDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 1.2 ที่อยู่สำนักงานใหญ่ */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <InfoItem label="1.2 ที่อยู่บริษัท (สำนักงานใหญ่)" value={formatFullAddr(s1.companyAddr)} />
        </div>
        <InfoItem
          label="โทรศัพท์สำนักงานใหญ่ / จุดสังเกต"
          value={
            [
              s1.companyAddr.phone !== '-' ? fmtPhone(s1.companyAddr.phone) : '',
              s1.companyAddr.note !== '-' ? `(${s1.companyAddr.note})` : '',
            ]
              .filter(Boolean)
              .join(' ') || '-'
          }
        />
      </div>

      {/* 1.3 สาขาศูนย์บริการ */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800">
            1.3 ที่ตั้งศูนย์บริการจริง ({s1.branches.length} สาขา • {s1.branchType})
          </span>
        </div>
        {s1.branches.length === 0 ? (
          <p className="text-slate-400">-</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {s1.branches.map((b, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800">สาขาที่ {idx + 1}</div>
                <div className="text-slate-700">{formatFullAddr(b)}</div>
                <div className="text-slate-500">
                  ผู้ดูแล: <b className="text-slate-800">{b.contactName}</b> • โทร:{' '}
                  <b className="text-slate-800">{b.phone !== '-' ? fmtPhone(b.phone) : '-'}</b>
                  {b.note !== '-' ? ` • หมายเหตุ: ${b.note}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1.5 - 1.7 ผู้ติดต่อ */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <span className="font-bold text-slate-800 block">1.5 ผู้ประสานงานหลัก</span>
          <InfoItem label="ชื่อ-นามสกุล / ตำแหน่ง" value={`${s1.primaryContact.name} (${s1.primaryContact.pos})`} />
          <InfoItem label="โทรศัพท์" value={s1.primaryContact.phone !== '-' ? fmtPhone(s1.primaryContact.phone) : '-'} />
          <InfoItem label="อีเมล / LINE ID" value={`${s1.primaryContact.email} • LINE: ${s1.primaryContact.line}`} />
        </div>
        <div className="space-y-2">
          <span className="font-bold text-slate-800 block">1.6 ผู้ติดต่อฉุกเฉินนอกเวลาทำการ</span>
          <InfoItem label="ชื่อ-นามสกุล" value={s1.backupContact.name} />
          <InfoItem label="โทรศัพท์" value={s1.backupContact.phone !== '-' ? fmtPhone(s1.backupContact.phone) : '-'} />
          <InfoItem
            label="ช่วงเวลาติดต่อได้"
            value={
              s1.backupContact.timeStart !== '-' || s1.backupContact.timeEnd !== '-'
                ? `${s1.backupContact.timeStart} - ${s1.backupContact.timeEnd}`
                : '-'
            }
          />
        </div>
        <div className="space-y-2">
          <span className="font-bold text-slate-800 block">1.7 ผู้มีอำนาจอนุมัติ / กรรมการ</span>
          <InfoItem label="ชื่อ-นามสกุล / ตำแหน่ง" value={s1.authorizer.name !== '-' ? `${s1.authorizer.name} (${s1.authorizer.pos})` : '-'} />
          <InfoItem label="โทรศัพท์" value={s1.authorizer.phone !== '-' ? fmtPhone(s1.authorizer.phone) : '-'} />
          <InfoItem label="อีเมล" value={s1.authorizer.email} />
        </div>
      </div>

      {/* 1.8 ข้อมูลบัญชีธนาคาร */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <InfoItem label="1.8 ชื่อบัญชีธนาคาร" value={s1.bank.accName} />
        <InfoItem label="เลขที่บัญชีธนาคาร" value={s1.bank.accNo} mono highlightClass="text-emerald-700" />
        <InfoItem label="ธนาคาร" value={s1.bank.bank} />
        <InfoItem label="สาขาธนาคาร" value={s1.bank.bankBranch} />
        <InfoItem label="การจดทะเบียน ภ.พ.20" value={s1.bank.vat20} />
      </div>
    </SectionCard>
  )
}
