'use client'

import React from 'react'
import { useVendorSetupForm } from './useVendorSetupForm'
import { Step1StoreInfo } from './steps/Step1StoreInfo'
import { Step2Expertise } from './steps/Step2Expertise'
import { Step3Coverage } from './steps/Step3Coverage'
import { Step4DocsFinance } from './steps/Step4DocsFinance'
import { Step5Agreements } from './steps/Step5Agreements'
import { SidebarChecklist } from './SidebarChecklist'
import { CheckCircle2, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react'

const STEP_TITLES = [
  'ข้อมูลร้าน & สาขา',
  'ความเชี่ยวชาญ (Pack Info)',
  'พื้นที่บริการ 91 สาขา',
  'เอกสาร & การเงิน',
  'สรุปและข้อตกลง',
]

export function VendorSetupWizard() {
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
  } = useVendorSetupForm()

  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-3xl border bg-white text-center space-y-4 shadow-sm" style={{ borderColor: 'var(--border)' }}>
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          ส่งใบสมัครเข้าร่วมเป็นคู่ค้าเรียบร้อยแล้ว
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          เลขที่ใบสมัครของท่าน: <span className="font-bold text-base" style={{ color: 'var(--red)' }}>{submittedResult.applicationNo}</span>
        </p>
        <div className="p-4 rounded-2xl bg-slate-50 border inline-block text-xs space-y-1 text-left" style={{ borderColor: 'var(--border)' }}>
          <div><span className="text-slate-500">สถานะ:</span> <b>รอเจ้าหน้าที่ตรวจสอบ (Pending Approval)</b></div>
          <div><span className="text-slate-500">ระดับคาดการณ์:</span> <b>{submittedResult.estimatedTier}</b> (คะแนนความพร้อม {submittedResult.score}/100)</div>
          <div><span className="text-slate-500">ขั้นตอนถัดไป:</span> เจ้าหน้าที่ SVC จะติดต่อกลับภายใน 1-2 วันทำการ</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress Step Bar */}
      <div className="p-4 rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'var(--border)' }}>
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
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-red-700 text-white shadow'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNo}
                </span>
                <span className={`font-semibold ${isActive ? 'text-red-800' : 'text-slate-600'}`}>
                  {title}
                </span>
                {stepNo < 5 && <div className="w-8 h-px bg-slate-200 hidden md:block" />}
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
            ) : (
              <button
                type="button"
                disabled={!canGoNext || submitting}
                onClick={submitApplication}
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
