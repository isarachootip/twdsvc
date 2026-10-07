'use client'

import { useRouter } from 'next/navigation'
import StageBadge from '@/components/ui/StageBadge'
import PaymentModal from '@/components/jobs/PaymentModal'
import {
  CustomerSection,
  ProductSection,
  DefectAndPhotosSection,
  FeesAndPaymentSection,
  TaxInvoiceModal,
  LinePreviewModal,
  PrintJobModal,
  type BranchOption,
} from './components/index'
import { useCsNewForm } from './components/useCsNewForm'

export default function CsNewForm({
  role,
  branchName,
  userBranchId = '',
  branches = [],
  initialPhone = '',
  initialProduct = '',
  initialSerialNo = '',
}: {
  role: string
  branchName: string
  userBranchId?: string
  branches?: BranchOption[]
  initialPhone?: string
  initialProduct?: string
  initialSerialNo?: string
}) {
  const router = useRouter()
  const form = useCsNewForm({ role, branchName, userBranchId, branches, initialPhone, initialProduct, initialSerialNo })

  const handleShowPayment = async () => {
    const r = await form.save()
    if (r) form.setPayOpen(true)
  }

  const handleSaveAndSend = async () => {
    const r = await form.save()
    if (!r) return
    if (form.fees.total > 0 && form.pay !== 'POS_RECEIPT' && !form.paid) {
      form.setPayOpen(true)
    } else {
      form.setLon(true)
    }
  }

  return (
    <div className="page-wide" style={{ maxWidth: 1180 }}>
      <div className="toprow" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px' }}>
        <div>
          <p className="page-title" style={{ fontSize: 17 }}>
            เปิดใบแจ้งซ่อม {form.activeBranchName && <span className="sub-mute" style={{ fontSize: 13 }}>· {form.activeBranchName}</span>}
          </p>
          <p className="page-sub">บันทึกข้อมูลลูกค้า สินค้า และรับชำระค่าดำเนินการ ณ วันเปิดงาน</p>
        </div>
        <div style={{ fontSize: 13.5 }}>
          เลขที่ใบแจ้งซ่อม: <b>{form.saved?.jobNo ?? '— (ออกเลขเมื่อบันทึก)'}</b>{' '}
          {form.saved && <StageBadge stage={form.saved.stage} />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <div>
          <fieldset disabled={!!form.saved || form.readOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
            <CustomerSection
              role={role}
              selectedBranchId={form.selectedBranchId}
              setSelectedBranchId={form.setSelectedBranchId}
              branchList={form.branchList}
              firstName={form.firstName} setFirstName={form.setFirstName}
              lastName={form.lastName} setLastName={form.setLastName}
              phone={form.phone} setPhone={form.setPhone}
              addr={form.addr} setAddr={form.setAddr}
              found={form.found} setFound={form.setFound}
              taxSame={form.taxSame} tax={form.tax}
              onTaxCheckbox={form.onTaxCheckbox}
              onEditTax={() => { form.setTaxDraft(form.tax!); form.setTaxModal(true) }}
              saved={!!form.saved}
            />
            <ProductSection
              sku={form.sku} onSkuChange={form.onSku}
              skuResults={form.skuResults} onPickSku={form.pickSku}
              onClearSkuResults={() => form.setSkuResults([])}
              product={form.product} setProduct={form.setProduct}
              brandName={form.brandName} setBrandName={form.setBrandName}
              brandId={form.brandId} setBrandId={form.setBrandId}
              brands={form.brands} symptom={form.symptom} setSymptom={form.setSymptom}
              serialNo={form.serialNo} setSerialNo={form.setSerialNo}
              onExtractSerial={form.extractSerialFromPhoto}
              extractingSerial={form.extractingSerial}
              warranty={form.warranty} setWarranty={form.setWarranty}
              allowOutside={form.allowOutside} setAllowOutside={form.setAllowOutside}
              sizeId={form.sizeId} setSizeId={form.setSizeId}
              sizes={form.sizes} method={form.method} setMethod={form.setMethod}
            />
            <DefectAndPhotosSection
              photos={form.photos} setPhotos={form.setPhotos}
              defect={form.defect} setDefect={form.setDefect}
            />
          </fieldset>
        </div>

        <FeesAndPaymentSection
          fees={form.fees} pay={form.pay} setPay={form.setPay}
          pos={form.pos} setPos={form.setPos}
          saved={form.saved} saving={form.saving}
          readOnly={form.readOnly} paid={form.paid}
          onShowPayment={handleShowPayment}
          onSaveAndSend={handleSaveAndSend}
          onOpenLon={() => form.setLon(true)}
          onOpenPrint={() => form.setPrintDoc(true)}
          onOpenPayModal={() => form.setPayOpen(true)}
          onReset={() => { window.location.href = '/cs/new' }}
          onBackToCs={() => router.push('/cs')}
        />
      </div>

      <TaxInvoiceModal
        open={form.taxModal} taxDraft={form.taxDraft}
        onChange={form.setTaxDraft} onClose={form.closeTax}
      />

      {form.saved && form.payOpen && (
        <PaymentModal
          job={{ id: form.saved.id, jobNo: form.saved.jobNo, version: 0 }}
          kind="intake" amount={form.fees.total} initialMethod={form.pay}
          onClose={() => form.setPayOpen(false)}
          onPaid={() => { form.setPaid(true); form.setPayOpen(false); form.setLon(true) }}
        />
      )}

      <LinePreviewModal
        open={form.lon && !!form.saved} onClose={() => form.setLon(false)}
        saved={form.saved} product={form.product} brandName={form.brandName}
        activeBranchName={form.activeBranchName} totalFee={form.fees.total} paid={form.paid}
      />

      <PrintJobModal
        open={form.printDoc && !!form.saved} onClose={() => form.setPrintDoc(false)}
        saved={form.saved} activeBranchName={form.activeBranchName}
        customerName={form.customerFullName} phone={form.phone}
        product={form.product} brandName={form.brandName}
        sku={form.sku} symptom={form.symptom} defect={form.defect}
        warranty={form.warranty} sizeName={form.sizeName} method={form.method}
        totalFee={form.fees.total} paid={form.paid}
      />
    </div>
  )
}
