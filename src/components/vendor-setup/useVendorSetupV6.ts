'use client'

import { useState, useEffect } from 'react'
import type { VendorApplicationFormV6 } from './types-v6'
import { INITIAL_FORM_V6 } from './initial-form-v6'

const STORAGE_KEY = 'svc_vendor_v6_draft'

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
        if (parsed.form) setForm(parsed.form)
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
    setForm(prev => ({ ...prev, ...patch }))
  }

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!form.supplierRegistered) return false
      if (form.supplierRegistered === 'เคยลงทะเบียนทำการค้ากับไทวัสดุ' && !/^\d{6}$/.test(form.spcode)) return false
      if (!form.company.trim() || form.taxId.length !== 13) return false
      if (!form.companyAddr.line1 || !form.companyAddr.subdistrict) return false
      if (form.branches.length === 0 || !form.branches[0].line1 || !form.branches[0].contactName) return false
      if (!form.primaryContact.name || !form.primaryContact.phone || !form.primaryContact.email) return false
      if (!form.bank.accName || !form.bank.accNo || !form.bank.bank) return false
    }
    if (step === 2) {
      if (form.cinProducts.length === 0 && form.onsProducts.length === 0) return false
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
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
