'use client'

import React, { useState } from 'react'
import { useVendorSetupV6 } from './useVendorSetupV6'
import { Step1CompanyInfo } from './steps-v6/Step1CompanyInfo'
import { Step2ProductsServices } from './steps-v6/Step2ProductsServices'
import { Step3Capacity } from './steps-v6/Step3Capacity'
import { Step4WorkingHours } from './steps-v6/Step4WorkingHours'
import { Step5BranchCoverage } from './steps-v6/Step5BranchCoverage'
import { Step6PricingFees } from './steps-v6/Step6PricingFees'
import { Step7CommercialGP } from './steps-v6/Step7CommercialGP'
import { Step8SLA } from './steps-v6/Step8SLA'
import { Step9SafetyCompliance } from './steps-v6/Step9SafetyCompliance'
import { Step10DocsAgreements } from './steps-v6/Step10DocsAgreements'
import { ApplicationStatusModal } from './ApplicationStatusModal'
import { CheckCircle2, ChevronLeft, ChevronRight, Send, AlertCircle, FileSearch } from 'lucide-react'

const STEP_TITLES = [
  'ข้อมูลบริษัท', 'สินค้า/บริการ', 'กำลังช่าง', 'เวลาทำการ', 'พื้นที่สาขา',
  'ราคา/เปิดเครื่อง', 'GP/การค้า', 'SLA', 'ความปลอดภัย', 'เอกสาร/ยืนยัน',
]

export function VendorSetupWizardV6() {
  const {
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
  } = useVendorSetupV6()

  const [statusModalOpen, setStatusModalOpen] = useState(false)

  if (submittedAppNo) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">ยื่นใบสมัครสำเร็จเรียบร้อยแล้ว</h2>
        <p className="text-xs text-slate-600">
          ระบบได้บันทึกข้อมูลและส่งใบสมัครเข้าร่วมโครงการศูนย์ซ่อมสินค้าไทวัสดุเรียบร้อยแล้ว
        </p>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl inline-block">
          <span className="text-xs text-red-800 font-semibold block mb-0.5">เลขที่ใบสมัครของคุณ (Application No.)</span>
          <span className="font-mono text-2xl font-bold text-red-700">{submittedAppNo}</span>
        </div>
        <p className="text-[11px] text-slate-500">
          กรุณาบันทึกหรือจดรหัสนี้ไว้เพื่อใช้ตรวจสอบสถานะการพิจารณา เจ้าหน้าที่จะติดต่อกลับภายใน 3-5 วันทำการ
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setStatusModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            ตรวจสอบสถานะใบสมัคร
          </button>
        </div>
        <ApplicationStatusModal
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          initialAppNo={submittedAppNo}
        />
      </div>
    )
  }

  const isValid = validateStep(currentStep)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-slate-500">
          ขั้นตอนที่ {currentStep} จาก 10: <strong className="text-slate-800">{STEP_TITLES[currentStep - 1]}</strong>
        </span>
        <button
          type="button"
          onClick={() => setStatusModalOpen(true)}
          className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1.5 transition"
        >
          <FileSearch className="w-4 h-4" /> ตรวจสอบสถานะใบสมัคร
        </button>
      </div>

      {/* Progress Step Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {STEP_TITLES.map((title, idx) => {
            const stepNo = idx + 1
            const isActive = currentStep === stepNo
            const isCompleted = currentStep > stepNo
            return (
              <button
                key={stepNo}
                type="button"
                onClick={() => setCurrentStep(stepNo)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive ? 'bg-red-700 text-white font-bold shadow-xs' :
                  isCompleted ? 'text-emerald-700 hover:bg-slate-50' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white text-red-700' :
                  isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isCompleted ? '✓' : stepNo}
                </span>
                <span>{title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Form Content Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        {currentStep === 1 && <Step1CompanyInfo form={form} onChange={updateForm} />}
        {currentStep === 2 && <Step2ProductsServices form={form} onChange={updateForm} />}
        {currentStep === 3 && <Step3Capacity form={form} onChange={updateForm} />}
        {currentStep === 4 && <Step4WorkingHours form={form} onChange={updateForm} />}
        {currentStep === 5 && <Step5BranchCoverage form={form} branches={form.branches} onChange={updateForm} />}
        {currentStep === 6 && <Step6PricingFees form={form} onChange={updateForm} onEditStep2={() => setCurrentStep(2)} />}
        {currentStep === 7 && <Step7CommercialGP form={form} onChange={updateForm} onEditStep2={() => setCurrentStep(2)} />}
        {currentStep === 8 && <Step8SLA form={form} onChange={updateForm} />}
        {currentStep === 9 && <Step9SafetyCompliance form={form} onChange={updateForm} />}
        {currentStep === 10 && <Step10DocsAgreements form={form} onChange={updateForm} />}

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 h-10 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isValid}
              className="px-5 h-10 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 flex items-center gap-1 shadow-xs"
            >
              ถัดไป <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitApplication}
              disabled={submitting || !isValid}
              className="px-6 h-10 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'กำลังส่งข้อมูล…' : 'ยืนยันส่งใบสมัคร'}</span>
            </button>
          )}
        </div>
      </div>

      <ApplicationStatusModal open={statusModalOpen} onClose={() => setStatusModalOpen(false)} />
    </div>
  )
}
