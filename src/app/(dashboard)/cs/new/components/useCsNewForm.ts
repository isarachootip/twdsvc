'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyAddress, formatAddress, type Address } from '@/components/ui/AddressFields'
import { type Photo } from '@/components/ui/PhotoButton'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/client'
import type { JobStage } from '@prisma/client'
import type {
  BranchOption,
  CustomerLookupResult,
  Brand,
  Size,
  Commodity,
  TaxInfo,
  FeesState,
} from './index'
import { validateCsForm } from './formValidation'

export interface SavedJob {
  id: string
  jobNo: string
  stage: JobStage
  fees: { operationFee: number; shippingFee: number; total: number }
  routing: { centerCode: string; vendorCode: string; vendorName: string; channel: string } | null
  trackingUrl?: string
  payUrl?: string
}

export function useCsNewForm({
  role,
  branchName,
  userBranchId = '',
  branches = [],
}: {
  role: string
  branchName: string
  userBranchId?: string
  branches?: BranchOption[]
}) {
  const [branchList, setBranchList] = useState<BranchOption[]>(branches)
  const defaultBranchId = userBranchId || branches.find(b => b.code === 'BN' || b.name.includes('บางนา'))?.id || branches[0]?.id || ''
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId)
  const { toast } = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [sizes, setSizes] = useState<Size[]>([])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [addr, setAddr] = useState<Address>(emptyAddress)
  const [taxSame, setTaxSame] = useState(true)
  const [tax, setTax] = useState<TaxInfo | null>(null)
  const [taxModal, setTaxModal] = useState(false)
  const [taxDraft, setTaxDraft] = useState<TaxInfo>({ name: '', id: '', addr: emptyAddress })
  const [found, setFound] = useState<CustomerLookupResult | null>(null)

  const [sku, setSku] = useState('')
  const [skuResults, setSkuResults] = useState<Commodity[]>([])
  const [product, setProduct] = useState('')
  const [brandId, setBrandId] = useState('')
  const [symptom, setSymptom] = useState('')
  const [warranty, setWarranty] = useState<'yes' | 'no'>('yes')
  const [allowOutside, setAllowOutside] = useState(false)
  const [sizeId, setSizeId] = useState<number | null>(null)
  const [method, setMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [defect, setDefect] = useState('')

  const [fees, setFees] = useState<FeesState>({ operationFee: 0, shippingFee: 0, total: 0 })
  const [pay, setPay] = useState<'PROMPTPAY_QR' | 'CARD_LINK' | 'POS_RECEIPT'>('PROMPTPAY_QR')
  const [pos, setPos] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<SavedJob | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [paid, setPaid] = useState(false)
  const [lon, setLon] = useState(false)
  const [printDoc, setPrintDoc] = useState(false)
  const skuTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    api<Brand[]>('/api/brands').then(setBrands).catch(() => {})
    api<Size[]>('/api/size-categories').then(s => { setSizes(s); if (s[0]) setSizeId(s[0].id) }).catch(() => {})
    if (branches.length > 0) {
      setBranchList(branches)
    } else if (role === 'ADMIN') {
      api<Array<{ id: string; code: string; name: string; type: string }>>('/api/sites')
        .then(sites => {
          const b = sites?.filter(s => s.type === 'BRANCH')
          if (b?.length) {
            setBranchList(b)
            setSelectedBranchId(prev => prev || b.find(x => x.code === 'BN' || x.name.includes('บางนา'))?.id || b[0].id)
          }
        })
        .catch(() => {})
    }
  }, [branches, role])

  useEffect(() => {
    if (!sizeId) return
    api<typeof fees>('/api/jobs/preview-fees', { body: { sizeCategoryId: sizeId, hasWarranty: warranty === 'yes', shippingMethod: method } })
      .then(f => setFees({ operationFee: f.operationFee, shippingFee: f.shippingFee, total: f.total })).catch(() => {})
  }, [sizeId, warranty, method])

  useEffect(() => {
    const d = phone.replace(/\D/g, '')
    setFound(null)
    if (!/^0\d{8,9}$/.test(d)) return
    const t = setTimeout(() => { api<CustomerLookupResult>(`/api/customers/lookup?phone=${d}`).then(setFound).catch(() => {}) }, 400)
    return () => clearTimeout(t)
  }, [phone])

  const onSku = (v: string) => {
    setSku(v)
    clearTimeout(skuTimer.current)
    if (v.trim().length < 2) { setSkuResults([]); return }
    skuTimer.current = setTimeout(() => api<Commodity[]>(`/api/commodities?search=${encodeURIComponent(v)}`).then(setSkuResults).catch(() => {}), 300)
  }

  const pickSku = (c: Commodity) => {
    setSku(c.sku)
    setProduct(c.name)
    const b = brands.find(x => x.name.toLowerCase() === c.brand.toLowerCase())
    if (b) setBrandId(String(b.id))
    setSkuResults([])
  }

  const onTaxCheckbox = (checked: boolean) => {
    if (checked) { setTaxSame(true); setTax(null); return }
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    setTaxDraft(tax ?? { name: fullName, id: '', addr: emptyAddress })
    setTaxSame(false)
    setTaxModal(true)
  }

  const closeTax = (doSave: boolean) => {
    if (doSave) {
      if (!taxDraft.name.trim()) { toast('กรุณากรอกชื่อ/บริษัทสำหรับใบกำกับภาษี', 'error'); return }
      if (!/^\d{13}$/.test(taxDraft.id)) { toast('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก', 'error'); return }
      setTax(taxDraft)
    } else if (!tax) { setTaxSame(true) }
    setTaxModal(false)
  }

  const save = useCallback(async (): Promise<SavedJob | null> => {
    if (saved) return saved
    const err = validateCsForm({ role, selectedBranchId, firstName, lastName, phone, product, brandId, symptom, sizeId, feesTotal: fees.total, pay, pos })
    if (err) { toast(err, 'error'); return null }
    setSaving(true)
    try {
      const brand = brands.find(b => String(b.id) === brandId)
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
      const r = await api<SavedJob>('/api/jobs', {
        body: {
          ...(role === 'ADMIN' ? { branchId: selectedBranchId } : {}),
          customerName: fullName, customerPhone: phone, customerAddress: formatAddress(addr) || null, customerZip: addr.zip || null,
          ...(tax && !taxSame ? { taxInvoiceName: tax.name, taxInvoiceId: tax.id, taxInvoiceAddr: formatAddress(tax.addr) } : {}),
          sku: sku.trim() || null, productName: product.trim(), brandId: Number(brandId), brandName: brand?.name ?? '',
          sizeCategoryId: sizeId, shippingMethod: method,
          photos: photos.filter((p): p is Photo => Boolean(p && p.fileUrl)),
          defectNote: defect.trim() || null,
          paymentMethod: fees.total > 0 ? pay : null, posReceiptNo: pay === 'POS_RECEIPT' ? pos.trim() : null,
        },
      })
      setSaved(r)
      setPaid(fees.total === 0 || pay === 'POS_RECEIPT')
      toast(`บันทึกใบแจ้งซ่อม ${r.jobNo} แล้ว`, 'success')
      return r
    } catch (e) {
      toast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', 'error')
      return null
    } finally { setSaving(false) }
  }, [saved, firstName, lastName, phone, addr, tax, taxSame, sku, product, brandId, brands, symptom, warranty, allowOutside, sizeId, method, photos, defect, fees.total, pay, pos, selectedBranchId, role, toast]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    branchList, selectedBranchId, setSelectedBranchId, brands, sizes,
    firstName, setFirstName, lastName, setLastName, phone, setPhone, addr, setAddr,
    taxSame, tax, setTax, taxModal, setTaxModal, taxDraft, setTaxDraft, found, setFound,
    sku, skuResults, setSkuResults, product, setProduct, brandId, setBrandId,
    symptom, setSymptom, warranty, setWarranty, allowOutside, setAllowOutside,
    sizeId, setSizeId, method, setMethod, photos, setPhotos, defect, setDefect,
    fees, pay, setPay, pos, setPos, saving, saved, payOpen, setPayOpen, paid, setPaid,
    lon, setLon, printDoc, setPrintDoc, onSku, pickSku, onTaxCheckbox, closeTax, save,
    readOnly: role !== 'CS' && role !== 'ADMIN',
    brandName: brands.find(b => String(b.id) === brandId)?.name ?? '',
    sizeName: sizes.find(s => s.id === sizeId)?.name ?? '',
    activeBranchName: branchName || branchList.find(b => b.id === selectedBranchId)?.name || '',
    customerFullName: [firstName.trim(), lastName.trim()].filter(Boolean).join(' '),
  }
}
