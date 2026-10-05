'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import LonPreview from '@/components/jobs/LonPreview'
import { useMe } from '@/components/ui/useMe'
import QuoteHeader from './QuoteHeader'
import QuoteMetaCards from './QuoteMetaCards'
import QuoteLinesTable from './QuoteLinesTable'
import QuoteTermsSection from './QuoteTermsSection'
import QuoteSummaryCard from './QuoteSummaryCard'
import QuoteSuccessModal from './QuoteSuccessModal'
import { useQuoteForm } from './useQuoteForm'

export default function QuoteForm({ jobId, role }: { jobId: string; role: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const revise = sp.get('revise') === '1'
  const me = useMe()

  const {
    job,
    lines,
    repairDays,
    setRepairDays,
    note,
    setNote,
    busy,
    sentQuote,
    lon,
    setLon,
    vendorCenters,
    selectedCenterId,
    setSelectedCenterId,
    openFee,
    warrantyDays,
    totals,
    handleUpdateLine,
    handleRemoveLine,
    handleAddLine,
    submit,
  } = useQuoteForm({ jobId, role, revise })

  if (!job) return <div className="empty">กำลังโหลด…</div>
  const readOnly = role !== 'VD' && role !== 'ADMIN'

  return (
    <div style={{ margin: '-20px -24px', minHeight: '100%', background: 'var(--bg)' }}>
      <QuoteHeader
        jobNo={job.jobNo}
        productName={job.productName}
        brandName={job.brandName}
        symptom={job.symptom}
        revise={revise}
        onBack={() => router.push('/vd')}
      />

      <div
        style={{
          maxWidth: 1080,
          margin: '24px auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <QuoteMetaCards
            role={role}
            hasWarranty={job.hasWarranty}
            openFee={openFee}
            selectedCenterId={selectedCenterId}
            vendorCenterId={job.vendorCenterId}
            vendorCenters={vendorCenters}
            onCenterChange={setSelectedCenterId}
          />

          <QuoteLinesTable
            lines={lines}
            onUpdate={handleUpdateLine}
            onRemove={handleRemoveLine}
            onAdd={handleAddLine}
          />

          <QuoteTermsSection
            repairDays={repairDays}
            warrantyDays={warrantyDays}
            note={note}
            onRepairDaysChange={setRepairDays}
            onNoteChange={setNote}
          />
        </div>

        <QuoteSummaryCard
          totals={totals}
          busy={busy}
          readOnly={readOnly}
          isSent={!!sentQuote}
          revise={revise}
          onSubmit={submit}
        />
      </div>

      <QuoteSuccessModal
        open={!!sentQuote}
        quote={sentQuote}
        job={job}
        onClose={() => router.push('/vd')}
        onSendLon={() => setLon(true)}
      />

      <LonPreview
        job={lon ? { id: job.id, jobNo: job.jobNo, productName: job.productName } : null}
        demo={!!me?.demoMode}
        onClose={() => router.push('/vd')}
        onDecided={() => router.push('/vd')}
      />
    </div>
  )
}
