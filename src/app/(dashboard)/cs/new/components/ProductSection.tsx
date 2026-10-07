'use client'

import { useState } from 'react'
import { SkuSearchInput } from './SkuSearchInput'
import { ProductPickerModal } from './ProductPickerModal'

export interface Brand {
  id: number
  name: string
}

export interface Size {
  id: number
  code: string
  name: string
}

export interface Commodity {
  id: number
  sku: string
  name: string
  brand: string
  barcode?: string | null
  deptName?: string | null
  model?: string | null
}

interface ProductSectionProps {
  sku: string
  onSkuChange: (val: string) => void
  skuResults: Commodity[]
  onPickSku: (item: Commodity) => void
  onClearSkuResults: () => void
  product: string
  setProduct: (val: string) => void
  brandId: string
  setBrandId: (val: string) => void
  brands: Brand[]
  symptom: string
  setSymptom: (val: string) => void
  serialNo: string
  setSerialNo: (val: string) => void
  onExtractSerial?: () => void
  extractingSerial?: boolean
  warranty: 'yes' | 'no'
  setWarranty: (val: 'yes' | 'no') => void
  allowOutside: boolean
  setAllowOutside: (val: boolean) => void
  sizeId: number | null
  setSizeId: (val: number) => void
  sizes: Size[]
  method: 'STANDARD' | 'EXPRESS'
  setMethod: (val: 'STANDARD' | 'EXPRESS') => void
}

export function ProductSection({
  sku,
  onSkuChange,
  skuResults,
  onPickSku,
  onClearSkuResults,
  product,
  setProduct,
  brandId,
  setBrandId,
  brands,
  symptom,
  setSymptom,
  serialNo,
  setSerialNo,
  onExtractSerial,
  extractingSerial,
  warranty,
  setWarranty,
  allowOutside,
  setAllowOutside,
  sizeId,
  setSizeId,
  sizes,
  method,
  setMethod,
}: ProductSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="pcard">
      <h3>ข้อมูลสินค้าและการรับประกัน</h3>
      <div className="grid3" style={{ marginTop: 10 }}>
        <SkuSearchInput
          sku={sku}
          onSkuChange={onSkuChange}
          skuResults={skuResults}
          onPickSku={onPickSku}
          onClearSkuResults={onClearSkuResults}
          onOpenPicker={() => setPickerOpen(true)}
        />
        <div className="field">
          <label>ชื่อสินค้า <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="inp" placeholder="เช่น สว่านไฟฟ้า" value={product} onChange={e => setProduct(e.target.value)} />
        </div>
        <div className="field">
          <label>แบรนด์ <span style={{ color: 'var(--red)' }}>*</span></label>
          <select className="sel" value={brandId} onChange={e => setBrandId(e.target.value)}>
            <option value="">เลือกแบรนด์</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div className="field">
          <label>อาการเสีย <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="inp" placeholder="อธิบายอาการเสีย" value={symptom} onChange={e => setSymptom(e.target.value)} />
        </div>
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Serial No. (ถ้ามี)</label>
            {onExtractSerial && (
              <button
                type="button"
                onClick={onExtractSerial}
                disabled={extractingSerial}
                style={{
                  fontSize: 11.5,
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand, #b91c1c)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                {extractingSerial ? 'กำลังอ่าน…' : '📷 ดึงค่าจากรูปที่ 5'}
              </button>
            )}
          </div>
          <input
            className="inp"
            placeholder="Key-in หรือดึงจากรูปที่ 5"
            value={serialNo}
            onChange={e => setSerialNo(e.target.value)}
          />
        </div>
      </div>
      <div className="divider" />
      <p className="hint" style={{ marginBottom: 6 }}>สถานะการรับประกัน</p>
      <div className="radio-row">
        <button type="button" className={`radio-opt ${warranty === 'yes' ? 'checked' : ''}`} onClick={() => setWarranty('yes')}>
          มีประกัน
        </button>
        <button type="button" className={`radio-opt ${warranty === 'no' ? 'checked' : ''}`} onClick={() => setWarranty('no')}>
          ไม่มีประกัน
        </button>
      </div>
      {warranty === 'no' && (
        <div className="checkbox-row">
          <input type="checkbox" id="outside" checked={allowOutside} onChange={e => setAllowOutside(e.target.checked)} />
          <label htmlFor="outside">ไม่มีประกัน — อนุญาตส่งซ่อมช่างนอกได้</label>
        </div>
      )}
      <p className="hint" style={{ margin: '14px 0 6px' }}>ขนาดสินค้า</p>
      <div className="radio-row">
        {sizes.map(s => (
          <button
            type="button"
            key={s.id}
            className={`radio-opt ${sizeId === s.id ? 'checked' : ''}`}
            onClick={() => setSizeId(s.id)}
          >
            {s.name.startsWith('สินค้า') ? s.name : `สินค้า${s.name}`}
          </button>
        ))}
      </div>
      <p className="hint" style={{ margin: '14px 0 6px' }}>วิธีจัดส่ง</p>
      <div className="radio-row">
        <button type="button" className={`radio-opt ${method === 'STANDARD' ? 'checked' : ''}`} onClick={() => setMethod('STANDARD')}>
          มาตรฐาน
        </button>
        <button type="button" className={`radio-opt ${method === 'EXPRESS' ? 'checked' : ''}`} onClick={() => setMethod('EXPRESS')}>
          ส่งด่วน (3PL)
        </button>
      </div>

      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onPickSku}
      />
    </div>
  )
}
