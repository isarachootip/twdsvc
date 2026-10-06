import { useState, useMemo } from 'react'
import type { VendorSetupFormData, BranchItemUI, RouteCoverageUI } from './types'
import { calculateVendorScoreAndTier } from '@/lib/services/vendor-tier.service'

const INITIAL_FORM: VendorSetupFormData = {
  store: {
    name: '',
    type: '',
    taxId: '',
    phone: '',
    lineId: '',
    branches: [
      {
        id: 'b-1',
        branchName: 'สาขาหลัก',
        address: '',
        province: 'กรุงเทพมหานคร',
        amphoe: '',
        phone: '',
        photo: null,
        radius: 30,
        vip: false,
        express: false,
      },
    ],
  },
  expertise: {
    appliances: {
      washing: true,
      fridge: true,
      air: false,
      tv: false,
      waterHeater: false,
      microwave: false,
    },
    isBrandAuthorized: false,
    defaultSlaDays: 7,
    warrantyDays: 90,
  },
  coverage: { coverage: {} },
  finance: {
    bank: 'กสิกรไทย',
    accNo: '',
    accName: '',
    commission: false,
    documents: { idcard: '', company: '', license: '', portfolio: [] },
  },
  agreements: {
    agreements: {
      sla: false,
      pdpa: false,
      standard: false,
      transportDamage: false,
      warrantyRepeat: false,
    },
    signatureUrl: '',
  },
}

export function useVendorSetupForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<VendorSetupFormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedResult, setSubmittedResult] = useState<{ applicationNo: string; score: number; estimatedTier: string } | null>(null)

  const updateStore = (patch: Partial<VendorSetupFormData['store']>) =>
    setForm(prev => ({ ...prev, store: { ...prev.store, ...patch } }))

  const updateBranches = (branches: BranchItemUI[]) =>
    setForm(prev => ({ ...prev, store: { ...prev.store, branches } }))

  const updateExpertise = (patch: Partial<VendorSetupFormData['expertise']>) =>
    setForm(prev => ({ ...prev, expertise: { ...prev.expertise, ...patch } }))

  const updateCoverage = (coverage: Record<string, RouteCoverageUI>) =>
    setForm(prev => ({ ...prev, coverage: { coverage } }))

  const updateFinance = (patch: Partial<VendorSetupFormData['finance']>) =>
    setForm(prev => ({ ...prev, finance: { ...prev.finance, ...patch } }))

  const updateAgreements = (patch: Partial<VendorSetupFormData['agreements']>) =>
    setForm(prev => ({ ...prev, agreements: { ...prev.agreements, ...patch } }))

  // Calculated tier & score
  const tierInfo = useMemo(() => {
    const branches = form.store.branches
    const avgRadius = branches.length
      ? Math.round(branches.reduce((acc, b) => acc + (b.radius || 30), 0) / branches.length)
      : 30
    return calculateVendorScoreAndTier({
      branchesCount: branches.length,
      avgRadius,
      hasVipBranch: branches.some(b => b.vip),
      hasExpressBranch: branches.some(b => b.express),
      applianceCount: Object.values(form.expertise.appliances).filter(Boolean).length,
      coverageCount: Object.keys(form.coverage.coverage).length,
      hasCompanyDoc: Boolean(form.finance.documents.company),
      hasTechLicense: Boolean(form.finance.documents.license),
      hasPortfolio: Boolean(form.finance.documents.portfolio.length),
      isBrandAuthorized: form.expertise.isBrandAuthorized,
    })
  }, [form])

  const canGoNext = useMemo(() => {
    if (currentStep === 1) {
      const s = form.store
      return Boolean(s.name.trim() && s.type && s.taxId.length === 13 && s.phone.trim() && s.branches.length > 0 && s.branches[0].address)
    }
    if (currentStep === 2) {
      return Object.values(form.expertise.appliances).some(Boolean)
    }
    if (currentStep === 3) {
      return Object.keys(form.coverage.coverage).length > 0
    }
    if (currentStep === 4) {
      const f = form.finance
      return Boolean(f.bank && f.accNo && f.accName && f.commission && f.documents.idcard)
    }
    if (currentStep === 5) {
      const a = form.agreements
      return Object.values(a.agreements).every(Boolean) && Boolean(a.signatureUrl)
    }
    return true
  }, [currentStep, form])

  const nextStep = () => {
    if (currentStep < 5 && canGoNext) setCurrentStep(c => c + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1)
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
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งใบสมัคร')
      setSubmittedResult({
        applicationNo: data.applicationNo,
        score: data.score,
        estimatedTier: data.estimatedTier,
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งใบสมัคร')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    currentStep,
    setCurrentStep,
    form,
    tierInfo,
    canGoNext,
    nextStep,
    prevStep,
    updateStore,
    updateBranches,
    updateExpertise,
    updateCoverage,
    updateFinance,
    updateAgreements,
    submitting,
    submitError,
    submittedResult,
    submitApplication,
  }
}
