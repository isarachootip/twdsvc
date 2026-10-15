'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { printElement } from '@/lib/print-element'
import type { JobView } from '@/lib/job-view'
import {
  buildPickupSlipData,
  formatPickupItemsText,
  parsePickupItemsText,
  type PickupRouteType,
  type PickupSlipMeta,
} from '@/lib/pickup-slip'
import PickupSlipSheet from './PickupSlipSheet'
import PickupSlipForm from './PickupSlipForm'

export interface PickupSlipModalState {
  jobs: JobView[]
  candidateJobs?: JobView[]
  route: PickupRouteType
  isPendingDispatch?: boolean
}

export interface PickupSlipModalProps {
  state: PickupSlipModalState | null
  busy?: boolean
  onClose: () => void
  onConfirmDispatch?: (
    jobs: JobView[],
    slip: PickupSlipMeta,
    method: 'PRINT' | 'LINK',
  ) => Promise<{ driverUrl?: string } | null>
}

export default function PickupSlipModal({
  state,
  busy = false,
  onClose,
  onConfirmDispatch,
}: PickupSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [route, setRoute] = useState<PickupRouteType>('GR_TO_DC')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [senderName, setSenderName] = useState('เจ้าหน้าที่ GR สาขา')
  const [senderPhone, setSenderPhone] = useState('0x-xxx-xxxx')
  const [receiverName, setReceiverName] = useState('หัวหน้าคลัง DC')
  const [receiverPhone, setReceiverPhone] = useState('0x-xxx-xxxx')
  const [driverName, setDriverName] = useState('นายสมศักดิ์ ขับดี')
  const [driverPhone, setDriverPhone] = useState('08x-xxx-xxxx')
  const [vehiclePlate, setVehiclePlate] = useState('1กข 1234')
  const [carrierLabel, setCarrierLabel] = useState('รถ DC')
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [scheduledTime, setScheduledTime] = useState('10:00')
  const [itemsText, setItemsText] = useState('')
  const [printTwoCopies, setPrintTwoCopies] = useState(true)
  const [driverUrl, setDriverUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const candidates = useMemo(() => {
    if (!state) return []
    const baseBranchId = state.jobs[0]?.branch.id
    const pool = state.candidateJobs?.length ? state.candidateJobs : state.jobs
    return baseBranchId ? pool.filter(j => j.branch.id === baseBranchId) : pool
  }, [state])

  const activeJobs = useMemo(
    () => candidates.filter(j => selectedIds.includes(j.id)),
    [candidates, selectedIds],
  )

  useEffect(() => {
    if (!state) return
    setRoute(state.route)
    setSelectedIds(state.jobs.map(j => j.id))
    setDriverUrl(null)
    const initSlip = buildPickupSlipData(state.jobs, state.route)
    setSenderName(initSlip.originContact)
    setSenderPhone(initSlip.originPhone)
    setReceiverName(initSlip.destContact)
    setReceiverPhone(initSlip.destPhone)
    setDriverName(initSlip.driverName)
    setDriverPhone(initSlip.driverPhone)
    setVehiclePlate(initSlip.vehiclePlate)
    setCarrierLabel(initSlip.carrierLabel)
    setScheduledDate(initSlip.scheduledDate)
    setScheduledTime(initSlip.scheduledTime)
    setItemsText(formatPickupItemsText(initSlip.items))
  }, [state])

  const baseSlip = useMemo(() => {
    if (!state) return null
    const jobsToUse = activeJobs.length > 0 ? activeJobs : state.jobs
    const fallback = buildPickupSlipData(jobsToUse, route, { scheduledDate, scheduledTime })
    const parsedItems = parsePickupItemsText(itemsText, fallback.items)
    return buildPickupSlipData(jobsToUse, route, {
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      driverName,
      driverPhone,
      vehiclePlate,
      carrierLabel,
      scheduledDate,
      scheduledTime,
      printTwoCopies,
      items: parsedItems.length > 0 ? parsedItems : fallback.items,
    })
  }, [state, activeJobs, route, senderName, senderPhone, receiverName, receiverPhone, driverName, driverPhone, vehiclePlate, carrierLabel, scheduledDate, scheduledTime, printTwoCopies, itemsText])

  if (!state || !baseSlip) return null

  const toggleJob = (job: JobView) => {
    const nextIds = selectedIds.includes(job.id)
      ? selectedIds.filter(id => id !== job.id)
      : [...selectedIds, job.id]
    if (nextIds.length === 0) return
    setSelectedIds(nextIds)
    const nextJobs = candidates.filter(j => nextIds.includes(j.id))
    const nextSlip = buildPickupSlipData(nextJobs, route, { scheduledDate, scheduledTime })
    setItemsText(formatPickupItemsText(nextSlip.items))
  }

  const buildMeta = (): PickupSlipMeta => ({
    pickupSlipNo: baseSlip.docNo,
    driverName: baseSlip.driverName,
    driverPhone: baseSlip.driverPhone,
    vehiclePlate: baseSlip.vehiclePlate,
    carrierLabel: baseSlip.carrierLabel,
    scheduledDate: baseSlip.scheduledDate,
    scheduledTime: baseSlip.scheduledTime,
    boxCount: baseSlip.totalBoxes,
    senderName: baseSlip.originContact,
    senderPhone: baseSlip.originPhone,
    receiverName: baseSlip.destContact,
    receiverPhone: baseSlip.destPhone,
  })

  const handlePrintAndConfirm = async () => {
    if (onConfirmDispatch && state.isPendingDispatch) {
      setSubmitting(true)
      try {
        const res = await onConfirmDispatch(activeJobs.length ? activeJobs : state.jobs, buildMeta(), 'PRINT')
        if (!res) return
      } finally {
        setSubmitting(false)
      }
    }
    printElement(printRef.current, `ใบรับสินค้า_${baseSlip.docNo}`)
  }

  const handleCreateLink = async () => {
    if (!onConfirmDispatch) return
    setSubmitting(true)
    try {
      const res = await onConfirmDispatch(activeJobs.length ? activeJobs : state.jobs, buildMeta(), 'LINK')
      if (res?.driverUrl) setDriverUrl(res.driverUrl)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} size="wide" className="pickup-slip-modal">
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, alignItems: 'start' }}>
        <PickupSlipForm
          route={route}
          setRoute={setRoute}
          candidates={candidates}
          selectedIds={selectedIds}
          onToggleJob={toggleJob}
          senderName={senderName}
          setSenderName={setSenderName}
          senderPhone={senderPhone}
          setSenderPhone={setSenderPhone}
          receiverName={receiverName}
          setReceiverName={setReceiverName}
          receiverPhone={receiverPhone}
          setReceiverPhone={setReceiverPhone}
          driverName={driverName}
          setDriverName={setDriverName}
          driverPhone={driverPhone}
          setDriverPhone={setDriverPhone}
          vehiclePlate={vehiclePlate}
          setVehiclePlate={setVehiclePlate}
          carrierLabel={carrierLabel}
          setCarrierLabel={setCarrierLabel}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          scheduledTime={scheduledTime}
          setScheduledTime={setScheduledTime}
          itemsText={itemsText}
          setItemsText={setItemsText}
          printTwoCopies={printTwoCopies}
          setPrintTwoCopies={setPrintTwoCopies}
          driverUrl={driverUrl}
          baseSlip={baseSlip}
          isPendingDispatch={state.isPendingDispatch}
          disabled={busy || submitting}
          onPrintAndConfirm={handlePrintAndConfirm}
          onCreateLink={onConfirmDispatch ? handleCreateLink : undefined}
        />

        <div style={{ backgroundColor: '#e5e7eb', padding: 16, borderRadius: 12, maxHeight: '82vh', overflowY: 'auto' }}>
          <div ref={printRef} className="print-area">
            <PickupSlipSheet
              data={baseSlip}
              copyLabel="ฉบับคนรถ (ถือไปตลอดเส้นทาง)"
              pageBreakAfter={baseSlip.printTwoCopies}
            />
            {baseSlip.printTwoCopies && (
              <div style={{ marginTop: 18 }}>
                <PickupSlipSheet
                  data={baseSlip}
                  copyLabel="ฉบับต้นทางเก็บ (เจ้าหน้าที่ต้นทางเก็บเป็นหลักฐาน)"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
