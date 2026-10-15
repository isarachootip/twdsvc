'use client'

import React from 'react'
import { formatThaiShortDate } from '@/lib/quotation-format'

export interface QuoteSignatureData {
  customer?: string | null
  storeManagerName?: string | null
  managerSignatureUrl?: string | null
  managerSignerName?: string | null
  isManagerProxy?: boolean
  managerSignedAt?: string | Date | null
  customerSignatureUrl?: string | null
  customerSignedAt?: string | Date | null
}

export default function QuoteSignatureSection({ data }: { data: QuoteSignatureData }) {
  const managerDisplayName = data.managerSignerName || data.storeManagerName || ''
  const managerTitle = data.isManagerProxy ? 'Manager on duty' : 'ผู้จัดการสาขา'

  return (
    <div
      style={{
        marginTop: 18,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 36,
      }}
    >
      {/* ฝั่งซ้าย: ลูกค้าอนุมัติใบเสนอราคา (ลงชื่อ/วันที่) */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            minHeight: 48,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            width: '100%',
            borderBottom: '1px solid #374151',
            paddingBottom: 4,
          }}
        >
          {data.customerSignatureUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.customerSignatureUrl}
              alt="Customer Signature"
              style={{ maxHeight: 44, maxWidth: 170, objectFit: 'contain' }}
            />
          ) : null}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#111827', marginTop: 6 }}>
          ลูกค้าอนุมัติใบเสนอราคา (ลงชื่อ/วันที่)
        </div>
        {(data.customer || data.customerSignedAt) && (
          <div style={{ fontSize: 10.5, color: '#4b5563', marginTop: 2 }}>
            {data.customer ? `(${data.customer})` : ''}
            {data.customerSignedAt ? ` · วันที่ ${formatThaiShortDate(data.customerSignedAt)}` : ''}
          </div>
        )}
      </div>

      {/* ฝั่งขวา: เจ้าหน้าที่ศูนย์บริการ / ผู้จัดการสาขา */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            minHeight: 48,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            width: '100%',
            borderBottom: '1px solid #374151',
            paddingBottom: 4,
          }}
        >
          {data.managerSignatureUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.managerSignatureUrl}
              alt="Manager Signature"
              style={{ maxHeight: 44, maxWidth: 170, objectFit: 'contain' }}
            />
          ) : null}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#111827', marginTop: 6 }}>
          เจ้าหน้าที่ศูนย์บริการ ({managerTitle})
        </div>
        {(managerDisplayName || data.managerSignedAt) && (
          <div style={{ fontSize: 10.5, color: '#4b5563', marginTop: 2 }}>
            {managerDisplayName ? `(${managerDisplayName})` : ''}
            {data.managerSignedAt ? ` · วันที่ ${formatThaiShortDate(data.managerSignedAt)}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
