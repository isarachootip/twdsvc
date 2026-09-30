import { Prisma, JobStage, Channel, ShipmentLegType } from '@prisma/client'

export type Tx = Prisma.TransactionClient

export type ActionType =
  | 'open' | 'assign_vendor' | 'record_intake_payment'
  | 'gr_receive' | 'gr_pack' | 'gr_handoff' | 'gr_receive_return' | 'gr_deliver_cs'
  | 'dispatch_pickup' | 'carrier_confirm_pickup'
  | 'dc_receive_outbound' | 'dc_handoff_vd' | 'dc_receive_inbound' | 'dc_dispatch_confirm'
  | 'vd_receive' | 'tpl_delivered' | 'vd_submit_quote' | 'vd_revise_quote'
  | 'vd_start_repair' | 'vd_pause_parts' | 'vd_resume_parts' | 'vd_finish_repair' | 'vd_return_pack'
  | 'customer_approve' | 'customer_reject' | 'cs_record_decision'
  | 'record_repair_payment' | 'cs_close' | 'cancel' | 'add_note'
  | 'cs_receive_payment' | 'cs_close_job' | 'cs_trade_in' | 'cs_return_only'

export interface PhotoInput {
  fileUrl: string
  fileName?: string
  mimeType?: string
  fileSize?: number
}

export interface ActionInput {
  version?: number
  note?: string
  location?: string
  photos?: PhotoInput[]
  // quote
  lines?: Array<{ type: string; description: string; unitPrice: number; quantity?: number; partWaitDays?: number; partWarrantyDays?: number }>
  repairDays?: number
  vendorNote?: string
  // decision
  decision?: 'approve' | 'reject' | 'APPROVED' | 'REJECTED'
  reason?: string
  // dispatch
  method?: 'PRINT' | 'LINK'
  // payment
  amount?: number
  paymentMethod?: string
  posReceiptNo?: string
  // assign_vendor
  vendorCenterId?: string
  channel?: 'DC' | 'DSD' | 'TPL'
  // close / pickup options
  pickupOption?: 'CUSTOMER' | 'STOCK' | '3PL' | 'TRADEIN' | 'RETURN_ONLY' | 'REPAIRED'
}

export interface Actor {
  userId: string | null
  role: string // CS/GR/DC/VD/S2/ADMIN/EXECUTIVE/CUSTOMER/DRIVER/SYSTEM
  siteId?: string | null
  vendorCenterId?: string | null
}

export type ActionResult =
  | { success: true; job: { id: string; jobNo: string; stage: JobStage; version: number }; extra: Record<string, unknown> }
  | { success: false; error: string; status?: number }

export type JobFull = Prisma.JobGetPayload<{
  include: {
    charges: true
    payments: true
    shipments: true
    quotes: { include: { lines: true } }
    vendorCenter: { include: { vendorParent: true } }
  }
}>

export interface Ctx {
  tx: Tx
  job: JobFull
  input: ActionInput
  actor: Actor
  now: Date
  extra: Record<string, unknown>
  extraEvents: string[]
}

export interface ActionDef {
  roles: string[]
  from?: JobStage[]
  event: string | ((c: Ctx) => string)
  to?: (c: Ctx) => JobStage
  photo?: boolean | ((c: Ctx) => boolean)
  location?: boolean
  effects?: (c: Ctx) => Promise<void>
  validate?: (c: Ctx) => void | Promise<void>
}
