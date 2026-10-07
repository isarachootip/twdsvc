'use client'

import Modal from '@/components/ui/Modal'
import type { Commodity } from './ProductSection'
import { useProductPicker } from './useProductPicker'

interface ProductPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (item: Commodity) => void
}

export function ProductPickerModal({ open, onClose, onSelect }: ProductPickerModalProps) {
  const {
    keyword,
    setKeyword,
    selectedBrand,
    setSelectedBrand,
    selectedDept,
    setSelectedDept,
    page,
    setPage,
    loading,
    items,
    total,
    meta,
    totalPages,
    handleReset,
  } = useProductPicker(open)

  const handlePick = (item: Commodity) => {
    onSelect(item)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>ค้นหาสินค้าจาก Product Master</h3>
          <p className="hint" style={{ margin: '3px 0 0' }}>ค้นหาด้วย SKU, บาร์โค้ด, แบรนด์, กลุ่มสินค้า หรือชื่อสินค้า</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr auto', gap: 8, marginBottom: 12 }}>
        <input
          className="inp"
          placeholder="ค้นหา SKU, บาร์โค้ด, ชื่อสินค้า, รุ่น..."
          value={keyword}
          onChange={e => { setKeyword(e.target.value); setPage(1) }}
          autoFocus
        />
        <select
          className="sel"
          value={selectedBrand}
          onChange={e => { setSelectedBrand(e.target.value); setPage(1) }}
        >
          <option value="">ทุกแบรนด์ ({meta.brands.length})</option>
          {meta.brands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          className="sel"
          value={selectedDept}
          onChange={e => { setSelectedDept(e.target.value); setPage(1) }}
        >
          <option value="">ทุกกลุ่มสินค้า ({meta.departments.length})</option>
          {meta.departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button type="button" className="btn" onClick={handleReset} style={{ whiteSpace: 'nowrap' }}>
          ล้างตัวกรอง
        </button>
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
        <table className="table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-sunken)', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', width: 130 }}>SKU / Barcode</th>
              <th style={{ padding: '8px 10px' }}>ชื่อสินค้า / รุ่น</th>
              <th style={{ padding: '8px 10px', width: 130 }}>แบรนด์</th>
              <th style={{ padding: '8px 10px', width: 160 }}>กลุ่มสินค้า (Dept)</th>
              <th style={{ padding: '8px 10px', width: 75, textAlign: 'center' }}>เลือก</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32 }} className="sub-mute">
                  กำลังค้นหาข้อมูลสินค้า…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32 }} className="sub-mute">
                  ไม่พบข้อมูลสินค้าที่ตรงกับเงื่อนไขค้นหา
                </td>
              </tr>
            ) : (
              items.map(it => (
                <tr
                  key={it.id}
                  style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                  onDoubleClick={() => handlePick(it)}
                >
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>
                    <div style={{ fontWeight: 600 }}>{it.sku}</div>
                    {it.barcode && <div className="sub-mute" style={{ fontSize: 11 }}>{it.barcode}</div>}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ fontWeight: 500 }}>{it.name}</div>
                    {it.model && <div className="sub-mute" style={{ fontSize: 11.5 }}>รุ่น: {it.model}</div>}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span className="badge" style={{ fontSize: 11.5 }}>{it.brand}</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 12 }}>
                    {it.deptName || '-'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => handlePick(it)}
                    >
                      เลือก
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span className="hint">
          พบสินค้าทั้งหมด <b>{total.toLocaleString()}</b> รายการ (หน้า {page} / {totalPages})
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ fontSize: 12 }}
          >
            ← ก่อนหน้า
          </button>
          <button
            type="button"
            className="btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => p + 1)}
            style={{ fontSize: 12 }}
          >
            ถัดไป →
          </button>
        </div>
      </div>
    </Modal>
  )
}
