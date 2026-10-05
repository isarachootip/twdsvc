import { Channel } from '@prisma/client'
import { ActionDef, ActionInput, Actor, Ctx, JobFull } from './types'
import { ActionError } from './errors'
import { getSetting } from './helpers'


export function validateRolePermission(actor: Actor, def: ActionDef): { isAdminOverride: boolean } {
  const isAdminOverride = actor.role === 'ADMIN' && !def.roles.includes('ADMIN')
  if (!def.roles.includes(actor.role) && actor.role !== 'ADMIN' && actor.role !== 'SYSTEM') {
    throw new ActionError(`สิทธิ์ ${actor.role} ไม่สามารถทำรายการนี้ได้`, 403)
  }
  return { isAdminOverride }
}

export function validateTenantScope(actor: Actor, job: JobFull) {
  // Fail-closed tenant scoping (08 §4, S1)
  if (['CS', 'GR', 'S2'].includes(actor.role) && (!actor.siteId || job.branchId !== actor.siteId)) {
    throw new ActionError('ไม่มีสิทธิ์เข้าถึงงานของสาขาอื่น', 403)
  }
  if (actor.role === 'VD' && (!actor.vendorCenterId || job.vendorCenterId !== actor.vendorCenterId)) {
    throw new ActionError('ไม่มีสิทธิ์เข้าถึงงานของศูนย์ซ่อมอื่น', 403)
  }
  if (actor.role === 'DC' && job.channel !== Channel.DC) {
    throw new ActionError('งานนี้ไม่ได้ผ่าน DC', 403)
  }
}

export function validateVersion(input: ActionInput, job: JobFull) {
  // Optimistic concurrency control (S7)
  if (input.version !== undefined && input.version !== null && Number(input.version) !== job.version) {
    throw new ActionError('ข้อมูลงานถูกเปลี่ยนแปลงโดยผู้อื่นแล้ว กรุณารีเฟรชหน้าจอ', 409)
  }
}

export function validateStageEligibility(def: ActionDef, job: JobFull) {
  if (def.from && !def.from.includes(job.stage)) {
    throw new ActionError(`งาน ${job.jobNo} ไม่อยู่ในขั้นตอนที่ทำรายการนี้ได้ (ปัจจุบัน: ${job.stage})`, 409)
  }
}

export async function validatePhotosAndLocation(c: Ctx, def: ActionDef) {
  const requirePhotos = (await getSetting(c.tx, 'REQUIRE_PHOTOS', 'false')) === 'true'
  const needPhoto = typeof def.photo === 'function' ? def.photo(c) : !!def.photo
  if (needPhoto && requirePhotos && !(c.input.photos?.length)) {
    throw new ActionError('กรุณาถ่ายภาพ/แนบภาพก่อนยืนยัน')
  }

  if (def.location && !(c.input.location ?? '').trim()) {
    throw new ActionError('กรุณากรอกเลขที่ Location', 400)
  }

  if (c.input.location) {
    c.input.location = c.input.location.trim().toUpperCase()
  }
}
