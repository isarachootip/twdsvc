'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Upload, RotateCcw, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/client'
import { DEFAULT_BRANDING, notifyBrandingUpdated } from '@/lib/hooks/useBranding'
import { useSave, SaveButton, Row } from './admin-helpers'

const DEFAULT_LOGO = DEFAULT_BRANDING.logoUrl
const DEFAULT_COMPANY_NAME = DEFAULT_BRANDING.companyName
const DEFAULT_TAX_ID = DEFAULT_BRANDING.taxId

interface BrandingProps {
  initialLogoUrl?: string
  initialCompanyName?: string
  initialTaxId?: string
  initialFooterNote?: string
}

export function BrandingConfigCard({
  initialLogoUrl = DEFAULT_LOGO,
  initialCompanyName = DEFAULT_COMPANY_NAME,
  initialTaxId = DEFAULT_TAX_ID,
  initialFooterNote = '',
}: BrandingProps) {
  const { toast } = useToast()
  const { saving, save, justSaved } = useSave()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || DEFAULT_LOGO)
  const [companyName, setCompanyName] = useState(initialCompanyName || DEFAULT_COMPANY_NAME)
  const [taxId, setTaxId] = useState(initialTaxId || DEFAULT_TAX_ID)
  const [footerNote, setFooterNote] = useState(initialFooterNote)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast('ขนาดไฟล์ต้องไม่เกิน 2MB', 'error')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'อัปโหลดไฟล์ไม่สำเร็จ')
      }
      const data: { fileUrl: string } = await res.json()
      setLogoUrl(data.fileUrl)
      toast('อัปโหลดไฟล์โลโก้สำเร็จ (กดบันทึกเพื่อใช้งาน)', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลด', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleResetLogo = () => {
    setLogoUrl(DEFAULT_LOGO)
    toast('คืนค่าโลโก้เป็นค่ามาตรฐานไทวัสดุแล้ว (กดบันทึกเพื่อยืนยัน)', 'info')
  }

  const handleSave = () => {
    save(async () => {
      await api('/api/admin/settings', {
        method: 'PUT',
        body: {
          COMPANY_LOGO_URL: logoUrl,
          COMPANY_NAME: companyName,
          COMPANY_TAX_ID: taxId,
          ...(footerNote ? { DOCUMENT_FOOTER_NOTE: JSON.stringify(footerNote.split('\n').filter(Boolean)) } : {}),
        },
      })
      notifyBrandingUpdated()
    })
  }

  return (
    <div className="pcard" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <ImageIcon size={20} className="text-primary" />
        <h3 style={{ margin: 0 }}>ตั้งค่าโลโก้และข้อมูลหัวเอกสาร (Branding & Document Header)</h3>
      </div>
      <p className="sub-mute" style={{ margin: '0 0 16px' }}>
        โลโก้และข้อมูลนิติบุคคลนี้จะถูกนำไปใช้ในเอกสารทางการทั้งหมด เช่น ใบรับแจ้งซ่อม, ใบส่งคืนสินค้า, ใบเสนอราคา และหน้าระบบติดตามสำหรับลูกค้า
      </p>

      {/* Logo Preview & Upload */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>ตัวอย่างโลโก้ปัจจุบัน (Preview)</div>
          <div style={{ background: '#ffffff', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 70 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Logo Preview"
              style={{ maxHeight: 54, maxWidth: '100%', objectFit: 'contain' }}
              onError={() => setLogoUrl(DEFAULT_LOGO)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn-sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} style={{ marginRight: 4 }} />
              {uploading ? 'กำลังอัปโหลด…' : 'เปลี่ยนโลโก้'}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleResetLogo}
              title="คืนค่าเป็นโลโก้ไทวัสดุเดิม"
            >
              <RotateCcw size={14} style={{ marginRight: 4 }} />
              คืนค่าเริ่มต้น
            </button>
          </div>
        </div>

        {/* Company & Document Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>ชื่อทางการบริษัท (Company Legal Name)</label>
            <input
              className="inp"
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="บริษัท ซีอาร์ซี ไทวัสดุ จำกัด"
            />
          </div>

          <div className="field">
            <label>เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
            <input
              className="inp"
              type="text"
              value={taxId}
              onChange={e => setTaxId(e.target.value)}
              placeholder="0105555021215"
            />
          </div>

          <div className="field">
            <label>ข้อความหมายเหตุ / เงื่อนไขท้ายเอกสาร (Footer Terms - 1 บรรทัดต่อ 1 ข้อ)</label>
            <textarea
              className="inp"
              rows={3}
              value={footerNote}
              onChange={e => setFooterNote(e.target.value)}
              placeholder="ข้อความหมายเหตุท้ายเอกสาร..."
              style={{ fontSize: 12 }}
            />
          </div>
        </div>
      </div>

      <Row>
        <SaveButton
          label="บันทึกโลโก้และข้อมูลเอกสาร"
          saving={saving}
          justSaved={justSaved}
          onClick={handleSave}
        />
      </Row>
    </div>
  )
}
