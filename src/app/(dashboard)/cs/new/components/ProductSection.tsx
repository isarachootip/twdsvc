'use client'

import { useState } from 'react'
import { SkuSearchInput } from './SkuSearchInput'
import { ProductPickerModal } from './ProductPickerModal'
import type { ProductSectionProps, Brand, Size, Commodity } from './product-types'

export type { Brand, Size, Commodity, ProductSectionProps }

export function ProductSection({
  sku, onSkuChange, skuResults, onPickSku, onClearSkuResults,
  product, setProduct, brandName = '', setBrandName, brandId = '', setBrandId,
  brands, symptom, setSymptom, serialNo, setSerialNo,
  onExtractSerial, extractingSerial, warranty, setWarranty,
  allowOutside, setAllowOutside, sizeId, setSizeId, sizes, method, setMethod,
}: ProductSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const currentBrand = brandName || (brands.find(b => String(b.id) === brandId)?.name ?? '')
  const handleBrandChange = (val: string) => {
    if (setBrandName) setBrandName(val)
    if (setBrandId) {
      const b = brands.find(x => x.name.trim().toLowerCase() === val.trim().toLowerCase())
      setBrandId(b ? String(b.id) : '')
    }
  }

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
          <input
            className="inp"
            list="brands-datalist"
            placeholder="พิมพ์หรือเลือกแบรนด์"
            value={currentBrand}
            onChange={e => handleBrandChange(e.target.value)}
          />
          <datalist id="brands-datalist">
            {brands.map(b => (
              <option key={b.id} value={b.name} />
            ))}
          </datalist>
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
