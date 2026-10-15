'use client'

import React from 'react'
import { fmtDate } from '@/lib/constants'

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
        marginTop: 28,
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 32,
      }}
    >
      {/* ฝั่งผู้จัดการสาขา */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
          ผู้มีอำนาจอนุมัติ ({managerTitle})
        </div>
        <div
          style={{
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {data.managerSignatureUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.managerSignatureUrl}
              alt="Manager Signature"
              style={{ maxHeight: 52, maxWidth: 180, objectFit: 'contain' }}
            />
          ) : (
            <div style={{ borderBottom: '1px dotted #94a3b8', width: '75%', height: 36, marginTop: 12 }} />
          )}
        </div>
        <div style={{ fontSize: 11.5, marginTop: 6, color: 'var(--text-1)' }}>
          (&nbsp;{managerDisplayName || '...................................................'} &nbsp;)
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>
          {managerTitle}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>
          วันที่:&nbsp;{data.managerSignedAt ? fmtDate(data.managerSignedAt) : '....... / ....... / ...........'}
        </div>
      </div>

      {/* ฝั่งลูกค้า */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
          ลูกค้า / ผู้มีอำนาจสั่งซ่อม
        </div>
        <div
          style={{
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {data.customerSignatureUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.customerSignatureUrl}
              alt="Customer Signature"
              style={{ maxHeight: 52, maxWidth: 180, objectFit: 'contain' }}
            />
          ) : (
            <div style={{ borderBottom: '1px dotted #94a3b8', width: '75%', height: 36, marginTop: 12 }} />
          )}
        </div>
        <div style={{ fontSize: 11.5, marginTop: 6, color: 'var(--text-1)' }}>
          (&nbsp;{data.customer || '...................................................'} &nbsp;)
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>
          ผู้สั่งซ่อม / เจ้าของสินค้า
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>
          วันที่:&nbsp;{data.customerSignedAt ? fmtDate(data.customerSignedAt) : '....... / ....... / ...........'}
        </div>
      </div>
    </div>
  )
}
