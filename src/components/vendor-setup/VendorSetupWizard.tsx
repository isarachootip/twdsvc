'use client'

import React from 'react'
import { useVendorSetupForm } from './useVendorSetupForm'
import { Step1StoreInfo } from './steps/Step1StoreInfo'
import { Step2Expertise } from './steps/Step2Expertise'
import { Step3Coverage } from './steps/Step3Coverage'
import { Step4DocsFinance } from './steps/Step4DocsFinance'
import { Step5Agreements } from './steps/Step5Agreements'
import { SidebarChecklist } from './SidebarChecklist'
import { VendorSetupSuccessView } from './VendorSetupSuccessView'
import { CheckCircle2, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react'

const STEP_TITLES = [
  'ข้อมูลร้าน & สาขา',
  'ความเชี่ยวชาญ (Pack Info)',
  'พื้นที่บริการสาขา SVC',
  'เอกสาร & การเงิน',
  'สรุปและข้อตกลง',
]

interface VendorSetupWizardProps {
  mode?: 'admin' | 'public'
  onFinish?: () => void
}

export function VendorSetupWizard({ mode = 'public', onFinish }: VendorSetupWizardProps) {
  const {
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
    draftRestored,
  } = useVendorSetupForm({ mode })

  if (submittedResult) {
    return <VendorSetupSuccessView result={submittedResult} onFinish={onFinish} />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {mode === 'admin' && onFinish && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs text-slate-500">
            โหมดบันทึกข้อมูลคู่ค้าโดยผู้ดูแลระบบ (Admin Assisted Onboarding)
          </span>
          <button
            type="button"
            onClick={onFinish}
            className="text-xs text-slate-600 hover:text-slate-900 transition underline underline-offset-2"
          >
            ← กลับไปหน้ารายชื่อคู่ค้า
          </button>
        </div>
      )}

      {/* Progress Step Bar */}
      <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2">
          {STEP_TITLES.map((title, idx) => {
            const stepNo = idx + 1
            const isActive = currentStep === stepNo
            const isCompleted = currentStep > stepNo
            return (
              <button
                key={stepNo}
                type="button"
                onClick={() => setCurrentStep(stepNo)}
                className="flex items-center gap-2 text-xs shrink-0 cursor-pointer select-none"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-all ${
                    isActive
                      ? 'bg-red-700 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNo}
                </span>
                <span className={`font-semibold ${isActive ? 'text-red-800' : 'text-slate-600'}`}>
                  {title}
                </span>
                {stepNo < 5 && <div className="w-6 h-px bg-slate-200 hidden md:block" />}
              </button>
            )
          })}
        </div>
      </div>

      {draftRestored && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          กู้คืนข้อมูลฉบับร่างที่คุณกรอกไว้แล้ว — เพื่อความปลอดภัย บัญชีธนาคาร เอกสารแนบ และลายเซ็นไม่ถูกบันทึกไว้ กรุณากรอก/อัปโหลดใหม่
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Grid: Steps + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          {currentStep === 1 && (
            <Step1StoreInfo
              store={form.store}
              onUpdateStore={updateStore}
              onUpdateBranches={updateBranches}
            />
          )}
          {currentStep === 2 && (
            <Step2Expertise
              expertise={form.expertise}
              onUpdateExpertise={updateExpertise}
            />
          )}
          {currentStep === 3 && (
            <Step3Coverage
              coverage={form.coverage.coverage}
              vendorBranches={form.store.branches}
              onUpdateCoverage={updateCoverage}
            />
          )}
          {currentStep === 4 && (
            <Step4DocsFinance
              finance={form.finance}
              onUpdateFinance={updateFinance}
            />
          )}
          {currentStep === 5 && (
            <Step5Agreements
              form={form}
              onUpdateAgreements={updateAgreements}
            />
          )}

          {/* Bottom Nav Bar */}
          <div className="flex items-center justify-between pt-6 border-t mt-6" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={prevStep}
              className="btn btn-secondary text-xs flex items-center gap-1 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                disabled={!canGoNext}
                onClick={nextStep}
                className="btn btn-primary text-xs flex items-center gap-1 disabled:opacity-40"
              >
                ถัดไป <ChevronRight className="w-4 h-4" />
              </button>
            ) : mode === 'admin' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!canGoNext || submitting}
                  onClick={() => submitApplication({ autoApprove: false })}
                  className="btn btn-secondary text-xs flex items-center gap-1 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" /> {submitting ? 'กำลังบันทึก...' : 'ส่งเข้าคิวรอตรวจสอบ'}
                </button>
                <button
                  type="button"
                  disabled={!canGoNext || submitting}
                  onClick={() => submitApplication({ autoApprove: true })}
                  className="btn btn-primary text-xs flex items-center gap-1 px-4 py-2 font-semibold disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" /> {submitting ? 'กำลังดำเนินการ...' : 'บันทึก & เปิดใช้งานทันที'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!canGoNext || submitting}
                onClick={() => submitApplication()}
                className="btn btn-primary text-xs flex items-center gap-1 px-6 py-2.5 font-bold disabled:opacity-40"
              >
                <Send className="w-4 h-4" /> {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งใบสมัครเข้าร่วม SVC'}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <SidebarChecklist
            form={form}
            tierInfo={tierInfo}
            currentStep={currentStep}
            onSelectStep={setCurrentStep}
          />
        </div>
      </div>
    </div>
  )
}
