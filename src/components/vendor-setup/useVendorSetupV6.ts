'use client'

import { useState, useEffect } from 'react'
import type { VendorApplicationFormV6 } from './types-v6'
import { INITIAL_FORM_V6 } from './initial-form-v6'

const STORAGE_KEY = 'svc_vendor_v6_draft'

export function normalizeVendorFormV6(form: VendorApplicationFormV6): VendorApplicationFormV6 {
  const companyAddr = form.companyAddr
  const branches = form.branches.map(b => ({
    ...b,
    line1: b.line1?.trim() || companyAddr.line1?.trim() || '',
    subdistrict: b.subdistrict?.trim() || companyAddr.subdistrict?.trim() || '',
    district: b.district?.trim() || companyAddr.district?.trim() || '',
    province: b.province?.trim() || companyAddr.province?.trim() || '',
    zip: b.zip?.trim() || companyAddr.zip?.trim() || '',
    phone: b.phone?.trim() || companyAddr.phone?.trim() || form.primaryContact.phone?.trim() || '',
    contactName: b.contactName?.trim() || form.primaryContact.name?.trim() || form.signName?.trim() || '',
  }))

  const hasOnsite = form.onsProducts.length > 0
  const filteredRates = (form.productGroupRates || []).filter(r =>
    r.serviceType === 'CARRY_IN'
      ? form.cinProducts.includes(r.groupName)
      : hasOnsite && form.onsProducts.includes(r.groupName)
  )
  const onsiteOverrides: Partial<VendorApplicationFormV6> = hasOnsite
    ? {}
    : {
        onsBrands: [],
        productDetails: {},
        productNote: '',
        onsTech: 0,
        onsTeams: 0,
        onsCapDay: 0,
        onsCapMonth: 0,
        onsBackup: 0,
        onsDays: [],
        onsHours: '',
        onsAppt: '',
        onsFast: 0,
        onsQueue: 0,
        onsRadius: '',
        coverage: {},
        onsFee: '',
        onsSlaApptHours: '',
        onsSlaArrivalDays: '',
        safetyStandards: [],
        onsiteTools: [],
      }

  return {
    ...form,
    ...onsiteOverrides,
    productGroupRates: filteredRates,
    branches,
    authorizer: {
      name: form.authorizer.name?.trim() || form.signName?.trim() || form.primaryContact.name?.trim() || '',
      pos: form.authorizer.pos?.trim() || form.signPos?.trim() || form.primaryContact.pos?.trim() || '',
      phone: form.authorizer.phone?.trim() || form.primaryContact.phone?.trim() || '',
      email: form.authorizer.email?.trim() || form.primaryContact.email?.trim() || '',
    },
    backupContact: {
      ...form.backupContact,
      name: form.backupContact.name?.trim() || form.primaryContact.name?.trim() || '',
      phone: form.backupContact.phone?.trim() || form.primaryContact.phone?.trim() || '',
    },
  }
}

export function useVendorSetupV6() {
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<VendorApplicationFormV6>(INITIAL_FORM_V6)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedAppNo, setSubmittedAppNo] = useState<string | null>(null)

  // Restore draft from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.form) setForm({ ...INITIAL_FORM_V6, ...parsed.form })
        if (parsed.step) setCurrentStep(parsed.step)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Auto-save draft on changes
  useEffect(() => {
    if (!submittedAppNo) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, step: currentStep }))
      } catch (e) {
        console.error(e)
      }
    }
  }, [form, currentStep, submittedAppNo])

  const updateForm = (patch: Partial<VendorApplicationFormV6>) => {
    setSubmitError(null)
    setForm(prev => ({ ...prev, ...patch }))
  }

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!form.supplierRegistered) return false
      if (form.supplierRegistered === 'เคยลงทะเบียนทำการค้ากับไทวัสดุ' && !/^\d{6}$/.test(form.spcode)) return false
      if (!form.company.trim() || !/^\d{13}$/.test(form.taxId.trim())) return false
      if (!form.companyAddr.line1.trim() || !form.companyAddr.subdistrict.trim()) return false
      if (form.branches.length === 0 || !form.branches[0].line1.trim() || !form.branches[0].contactName.trim()) return false
      if (!form.primaryContact.name.trim() || !form.primaryContact.phone.trim() || !form.primaryContact.email.trim()) return false
      if (!form.bank.accName.trim() || !form.bank.accNo.trim() || !form.bank.bank.trim()) return false
    }
    if (step === 2) {
      if (form.cinProducts.length === 0 && form.onsProducts.length === 0) return false
      const rates = form.productGroupRates || []
      const allCinConfigured = form.cinProducts.every(name =>
        rates.some(r => r.serviceType === 'CARRY_IN' && r.groupName === name && r.minInspectionFee >= 0 && r.gpPct >= 0)
      )
      const allOnsConfigured = form.onsProducts.every(name =>
        rates.some(r => r.serviceType === 'ON_SITE' && r.groupName === name && r.minInspectionFee >= 0 && r.gpPct >= 0)
      )
      if (!allCinConfigured || !allOnsConfigured) return false
    }
    if (step === 10) {
      const a = form.agreements
      if (!a.sla || !a.inspect || !a.reportApp || !a.training || !a.pdpa || !a.truth) return false
      if (!form.signName.trim() || !form.signPos.trim()) return false
    }
    return true
  }

  const nextStep = () => {
    if (currentStep < 10 && validateStep(currentStep)) {
      setCurrentStep(c => c + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(c => c - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const submitApplication = async () => {
    if (!validateStep(1)) {
      setCurrentStep(1)
      setSubmitError('กรุณาตรวจสอบและกรอกข้อมูลในขั้นตอนที่ 1 (ข้อมูลบริษัทและศูนย์บริการ) ให้ครบถ้วน')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!validateStep(2)) {
      setCurrentStep(2)
      setSubmitError('กรุณาเลือกประเภทสินค้าที่รับบริการอย่างน้อย 1 รายการ ในขั้นตอนที่ 2')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = normalizeVendorFormV6(form)
      const res = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล')
      setSubmittedAppNo(data.applicationNo)
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    currentStep,
    setCurrentStep,
    form,
    updateForm,
    nextStep,
    prevStep,
    validateStep,
    submitting,
    submitError,
    submittedAppNo,
    submitApplication,
  }
}
