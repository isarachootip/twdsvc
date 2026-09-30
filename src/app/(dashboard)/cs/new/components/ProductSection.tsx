'use client'

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
  return (
    <div className="pcard">
      <h3>ข้อมูลสินค้าและการรับประกัน</h3>
      <div className="grid3" style={{ marginTop: 10 }}>
        <div className="field" style={{ position: 'relative' }}>
          <label>SKU (ถ้ามี)</label>
          <input
            className="inp"
            placeholder="ไม่บังคับ"
            value={sku}
            onChange={e => onSkuChange(e.target.value)}
            onBlur={() => setTimeout(onClearSkuResults, 200)}
          />
          {skuResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                zIndex: 20,
                left: 0,
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                marginTop: 2,
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {skuResults.map(c => (
                <button
                  type="button"
                  key={c.id}
                  onMouseDown={() => onPickSku(c)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 10px',
                    fontSize: 12.5,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <b>{c.sku}</b> — {c.name} <span className="sub-mute">{c.brand}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
      <div className="field" style={{ marginTop: 12 }}>
        <label>อาการเสีย <span style={{ color: 'var(--red)' }}>*</span></label>
        <input className="inp" placeholder="อธิบายอาการเสีย" value={symptom} onChange={e => setSymptom(e.target.value)} />
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
          มาตรฐาน (รอ VD/DC เข้ารับตามรอบ)
        </button>
        <button type="button" className={`radio-opt ${method === 'EXPRESS' ? 'checked' : ''}`} onClick={() => setMethod('EXPRESS')}>
          ส่งด่วน (3PL)
        </button>
      </div>
    </div>
  )
}
