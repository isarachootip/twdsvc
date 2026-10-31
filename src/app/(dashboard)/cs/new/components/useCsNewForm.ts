'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyAddress, formatAddress, type Address } from '@/components/ui/AddressFields'
import { type Photo } from '@/components/ui/PhotoButton'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/client'
import { parseFormattedAddress, splitCustomerFullName } from '@/lib/address-parser'
import type { JobStage } from '@prisma/client'
import type {
  BranchOption, CustomerLookupResult, Brand, Size, Commodity, TaxInfo, FeesState,
} from './index'
import { validateCsForm } from './formValidation'
import { useSerialExtractor } from './useSerialExtractor'
import { useCustomerLookup } from './useCustomerLookup'
import { useProductTypes } from './useProductTypes'

export interface SavedJob {
  id: string
  jobNo: string
  stage: JobStage
  fees: { operationFee: number; shippingFee: number; total: number }
  routing: { centerCode: string; vendorCode: string; vendorName: string; channel: string } | null
  trackingUrl?: string
  payUrl?: string
}

export interface UseCsNewFormProps {
  role: string
  branchName: string
  userBranchId?: string
  branches?: BranchOption[]
  initialPhone?: string
  initialProduct?: string
  initialSerialNo?: string
}

export function useCsNewForm({
  role, branchName, userBranchId = '', branches = [], initialPhone = '', initialProduct = '', initialSerialNo = '',
}: UseCsNewFormProps) {
  const [branchList, setBranchList] = useState<BranchOption[]>(branches)
  const defaultBranchId = userBranchId || branches.find(b => b.code === 'BN' || b.name.includes('บางนา'))?.id || branches[0]?.id || ''
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId)
  const { toast } = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const { productTypes, autoMatchProductType } = useProductTypes()

  const [firstName, setFirstName] = useState(''), [lastName, setLastName] = useState('')
  const [addr, setAddr] = useState<Address>(emptyAddress), [taxSame, setTaxSame] = useState(true), [tax, setTax] = useState<TaxInfo | null>(null)
  const [taxModal, setTaxModal] = useState(false), [taxDraft, setTaxDraft] = useState<TaxInfo>({ name: '', id: '', addr: emptyAddress })
  const [sku, setSku] = useState(''), [skuResults, setSkuResults] = useState<Commodity[]>([]), [product, setProduct] = useState(initialProduct)
  const [productGroupName, setProductGroupName] = useState('')
  const [brandId, setBrandId] = useState(''), [brandName, setBrandName] = useState(''), [symptom, setSymptom] = useState('')
  const [serialNo, setSerialNo] = useState(initialSerialNo || ''), [warranty, setWarranty] = useState<'yes' | 'no'>('yes'), [allowOutside, setAllowOutside] = useState(false)
  const [sizeId, setSizeId] = useState<number | null>(null), [method, setMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD')
  const [photos, setPhotos] = useState<Photo[]>([]), [defect, setDefect] = useState('')
  const { extractSerialFromPhoto, extracting: extractingSerial } = useSerialExtractor(photos, setSerialNo)

  const handleApplyCustomer = useCallback((cust: CustomerLookupResult) => {
    const { firstName: fName, lastName: lName } = splitCustomerFullName(cust.customerName)
    setFirstName(fName); setLastName(lName)
    setAddr(parseFormattedAddress(cust.customerAddress, cust.customerZip))
    if (cust.taxInvoiceId && cust.taxInvoiceName) {
      setTaxSame(false)
      setTax({ name: cust.taxInvoiceName, id: cust.taxInvoiceId, addr: parseFormattedAddress(cust.taxInvoiceAddr, null) })
    } else {
      setTaxSame(true); setTax(null)
    }
  }, [])

  const {
    phone, setPhone, candidates: phoneCandidates, searching: searchingPhone,
    found, setFound, isNewCustomer, pickCustomer, closeDropdown: closePhoneDropdown,
  } = useCustomerLookup({ initialPhone, onApplyCustomer: handleApplyCustomer })

  const [fees, setFees] = useState<FeesState>({ operationFee: 0, shippingFee: 0, total: 0 })
  const [pay, setPay] = useState<'PROMPTPAY_QR' | 'CARD_LINK' | 'POS_RECEIPT'>('PROMPTPAY_QR')
  const [pos, setPos] = useState('')
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState<SavedJob | null>(null)
  const [payOpen, setPayOpen] = useState(false), [paid, setPaid] = useState(false)
  const [lon, setLon] = useState(false), [printDoc, setPrintDoc] = useState(false)
  const skuTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    api<Brand[]>('/api/brands').then(setBrands).catch(() => {})
    api<Size[]>('/api/size-categories').then(s => { setSizes(s); if (s[0]) setSizeId(s[0].id) }).catch(() => {})
    if (branches.length > 0) {
      setBranchList(branches)
    } else if (role === 'ADMIN') {
      api<Array<{ id: string; code: string; name: string; type: string }>>('/api/sites').then(sites => {
        const b = sites?.filter(s => s.type === 'BRANCH')
        if (b?.length) {
          setBranchList(b)
          setSelectedBranchId(prev => prev || b.find(x => x.code === 'BN' || x.name.includes('บางนา'))?.id || b[0].id)
        }
      }).catch(() => {})
    }
  }, [branches, role])

  useEffect(() => {
    if (!sizeId) return
    api<{ operationFee: number; shippingFee: number; total: number; operationFeeBaht?: number; shippingFeeBaht?: number; totalBaht?: number }>('/api/jobs/preview-fees', { body: { sizeCategoryId: sizeId, hasWarranty: warranty === 'yes', shippingMethod: method } })
      .then(f => setFees({
        operationFee: f.operationFeeBaht ?? (f.operationFee >= 1000 && f.operationFee % 100 === 0 ? f.operationFee / 100 : f.operationFee),
        shippingFee: f.shippingFeeBaht ?? (f.shippingFee >= 1000 && f.shippingFee % 100 === 0 ? f.shippingFee / 100 : f.shippingFee),
        total: f.totalBaht ?? (f.total >= 1000 && f.total % 100 === 0 ? f.total / 100 : f.total),
      })).catch(() => {})
  }, [sizeId, warranty, method])

  const onSku = (v: string) => {
    setSku(v)
    clearTimeout(skuTimer.current)
    if (v.trim().length < 2) { setSkuResults([]); return }
    skuTimer.current = setTimeout(() => api<Commodity[]>(`/api/commodities?search=${encodeURIComponent(v)}`).then(setSkuResults).catch(() => {}), 300)
  }

  const onBrandChange = (val: string) => {
    setBrandName(val)
    const b = brands.find(x => x.name.trim().toLowerCase() === val.trim().toLowerCase())
    setBrandId(b ? String(b.id) : '')
  }

  const pickSku = (c: Commodity) => {
    setSku(c.sku); setProduct(c.name); setBrandName(c.brand)
    const b = brands.find(x => x.name.trim().toLowerCase() === c.brand.trim().toLowerCase())
    setBrandId(b ? String(b.id) : '')
    const matchedGroup = autoMatchProductType(c)
    if (matchedGroup) setProductGroupName(matchedGroup)
    setSkuResults([])
  }

  const onTaxCheckbox = (checked: boolean) => {
    if (checked) { setTaxSame(true); setTax(null); return }
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    setTaxDraft(tax ?? { name: fullName, id: '', addr: emptyAddress })
    setTaxSame(false); setTaxModal(true)
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
    const err = validateCsForm({ role, selectedBranchId, firstName, lastName, phone, productGroupName, product, brandName, symptom, sizeId, feesTotal: fees.total, pay, pos, photos })
    if (err) {
      toast(err, 'error')
      if (err.includes('ภาพถ่าย')) document.getElementById('defect-photos-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return null
    }
    setSaving(true)
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
      const r = await api<SavedJob>('/api/jobs', {
        body: {
          ...(role === 'ADMIN' ? { branchId: selectedBranchId } : {}),
          customerName: fullName, customerPhone: phone, customerAddress: formatAddress(addr) || null, customerZip: addr.zip || null,
          ...(tax && !taxSame ? { taxInvoiceName: tax.name, taxInvoiceId: tax.id, taxInvoiceAddr: formatAddress(tax.addr) } : {}),
          sku: sku.trim() || null, productName: product.trim(), productGroupName: productGroupName.trim(),
          brandId: brandId ? Number(brandId) : null, brandName: brandName.trim(),
          symptom: symptom.trim(), serialNo: serialNo.trim() || null, hasWarranty: warranty === 'yes', allowNonAuth: allowOutside,
          sizeCategoryId: sizeId, shippingMethod: method,
          photos: photos.filter((p): p is Photo => Boolean(p && p.fileUrl)),
          defectNote: defect.trim() || null,
          paymentMethod: fees.total > 0 ? pay : null, posReceiptNo: pay === 'POS_RECEIPT' ? pos.trim() : null,
        },
      })
      setSaved(r); setPaid(fees.total === 0 || pay === 'POS_RECEIPT')
      toast(`บันทึกใบแจ้งซ่อม ${r.jobNo} แล้ว`, 'success')
      return r
    } catch (e) {
      toast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', 'error')
      return null
    } finally { setSaving(false) }
  }, [saved, firstName, lastName, phone, addr, tax, taxSame, sku, product, productGroupName, brandName, brandId, symptom, serialNo, warranty, allowOutside, sizeId, method, photos, defect, fees.total, pay, pos, selectedBranchId, role, toast])

  return {
    branchList, selectedBranchId, setSelectedBranchId, brands, sizes, productTypes,
    firstName, setFirstName, lastName, setLastName, phone, setPhone,
    phoneCandidates, searchingPhone, isNewCustomer, pickCustomer, closePhoneDropdown,
    addr, setAddr, taxSame, tax, setTax, taxModal, setTaxModal, taxDraft, setTaxDraft, found, setFound,
    sku, skuResults, setSkuResults, productGroupName, setProductGroupName, product, setProduct, brandId, setBrandId, brandName, setBrandName: onBrandChange,
    symptom, setSymptom, serialNo, setSerialNo, extractSerialFromPhoto, extractingSerial,
    warranty, setWarranty, allowOutside, setAllowOutside, sizeId, setSizeId, method, setMethod,
    photos, setPhotos, defect, setDefect, fees, pay, setPay, pos, setPos, saving, saved,
    payOpen, setPayOpen, paid, setPaid, lon, setLon, printDoc, setPrintDoc, onSku, pickSku, onTaxCheckbox, closeTax, save,
    readOnly: role !== 'CS' && role !== 'ADMIN',
    sizeName: sizes.find(s => s.id === sizeId)?.name ?? '',
    activeBranch: branchList.find(b => b.id === selectedBranchId) || branchList.find(b => b.name === branchName) || null,
    activeBranchName: branchName || branchList.find(b => b.id === selectedBranchId)?.name || '',
    customerFullName: [firstName.trim(), lastName.trim()].filter(Boolean).join(' '),
    customerAddressText: formatAddress(addr) || '',
  }
}
