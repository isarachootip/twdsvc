'use client'

import { X, CheckCircle2, XCircle } from 'lucide-react'
import type { CommodityItem } from './types'

interface ProductDetailModalProps {
  product: CommodityItem | null
  onClose: () => void
}

function Field({ label, value, mono = false }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
  const displayVal = value !== null && value !== undefined && value !== '' ? String(value) : '-'
  return (
    <div className="flex flex-col py-1.5 border-b border-gray-100 last:border-b-0">
      <span className="text-[11px] text-gray-500 font-medium">{label}</span>
      <span className={`text-[13px] text-gray-900 ${mono ? 'font-mono' : ''}`}>{displayVal}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50/70 border rounded-xl p-3.5" style={{ borderColor: 'var(--border)' }}>
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">{children}</div>
    </div>
  )
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border"
        style={{ borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between bg-gray-50/90" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-base text-gray-900 bg-white px-2 py-0.5 rounded border">
                SKU: {product.sku}
              </span>
              {product.active ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <CheckCircle2 size={12} /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                  <XCircle size={12} /> In-active
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/60 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body - 32 Fields across 5 Sections */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-sm">
          {/* Section 1: ข้อมูลพื้นฐานสินค้า */}
          <Section title="1. ข้อมูลพื้นฐานสินค้า">
            <Field label="ชื่อสินค้า (name)" value={product.name} />
            <Field label="รหัสสินค้า (sku)" value={product.sku} mono />
            <Field label="แบรนด์ (brand)" value={product.brand} />
            <Field label="รหัสแบรนด์ (brand_id)" value={product.brandCode} mono />
            <Field label="รุ่น (model)" value={product.model} />
            <Field label="ประเภทสินค้า (product_type)" value={product.productType} />
            <Field label="เงื่อนไขสินค้า (sku_condition)" value={product.skuCondition} />
            <Field label="คำอธิบายเงื่อนไข (sku_condition_name)" value={product.skuConditionName} />
          </Section>

          {/* Section 2: ข้อมูลบาร์โค้ด (IBC / SBC / บาร์โค้ด 1-5) */}
          <Section title="2. ข้อมูลบาร์โค้ด (Barcodes)">
            <Field label="Barcode หลัก" value={product.barcode} mono />
            <Field label="IBC (Inner Barcode)" value={product.ibc} mono />
            <Field label="SBC (Shipping Barcode)" value={product.sbc} mono />
            <Field label="Barcode 2" value={product.barcode2} mono />
            <Field label="Barcode 3" value={product.barcode3} mono />
            <Field label="Barcode 4" value={product.barcode4} mono />
            <Field label="Barcode 5" value={product.barcode5} mono />
          </Section>

          {/* Section 3: โครงสร้างหมวดหมู่สินค้า */}
          <Section title="3. การจัดกลุ่มหมวดหมู่สินค้า">
            <Field label="รหัสแผนก (dept_no)" value={product.deptNo} mono />
            <Field label="ชื่อแผนก (dept_name)" value={product.deptName} />
            <Field label="รหัสหมวดย่อย (sdept_no)" value={product.sdeptNo} mono />
            <Field label="ชื่อหมวดย่อย (sdept_name)" value={product.sdeptName} />
            <Field label="รหัสคลาส (class_no)" value={product.classNo} mono />
            <Field label="ชื่อคลาส (class_name)" value={product.className} />
            <Field label="รหัสคลาสย่อย (sclass_no)" value={product.sclassNo} mono />
            <Field label="ชื่อคลาสย่อย (sclass_name)" value={product.sclassName} />
          </Section>

          {/* Section 4: ข้อมูลราคาและต้นทุน */}
          <Section title="4. ราคาและต้นทุน">
            <Field label="ราคาขาย (sku_price)" value={product.skuPrice ? `฿${product.skuPrice}` : '-'} mono />
            <Field label="ราคาทุน (sku_cost)" value={product.skuCost ? `฿${product.skuCost}` : '-'} mono />
            <Field label="ราคาปกติ (norprice)" value={product.norprice ? `฿${product.norprice}` : '-'} mono />
            <Field label="ราคา POS (posprice)" value={product.posprice ? `฿${product.posprice}` : '-'} mono />
            <Field label="รหัส Distrm (distrmcode)" value={product.distrmcode} mono />
          </Section>

          {/* Section 5: ผู้จัดจำหน่ายและหน่วยนับ */}
          <Section title="5. ผู้จัดจำหน่าย สถานะ และหน่วยนับ">
            <Field label="รหัส Vendor (vendor_no)" value={product.vendorNo} mono />
            <Field label="ชื่อ Vendor (vendor_name)" value={product.vendorName} />
            <Field label="รหัสหน่วยนับ (unit_code)" value={product.unitCode} mono />
            <Field label="ชื่อหน่วยนับ (unit_name)" value={product.unitName} />
            <Field label="รหัสสถานะ SKU (sku_status_code)" value={product.skuStatusCode} mono />
            <Field label="ชื่อสถานะ SKU (sku_status_name)" value={product.skuStatusName} />
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}
