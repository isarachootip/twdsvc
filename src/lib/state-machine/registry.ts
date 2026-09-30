import { ActionDef, ActionInput, ActionType } from './types'
import { INTAKE_GR_ACTIONS } from './actions-intake-gr'
import { LOGISTICS_ACTIONS } from './actions-logistics'
import { VENDOR_ACTIONS } from './actions-vendor'
import { CLOSE_ACTIONS } from './actions-close'

export const ACTIONS: Record<string, ActionDef> = {
  ...INTAKE_GR_ACTIONS,
  ...LOGISTICS_ACTIONS,
  ...VENDOR_ACTIONS,
  ...CLOSE_ACTIONS,
}

export const ALIASES = ['cs_receive_payment', 'cs_close_job', 'cs_trade_in', 'cs_return_only'] as const

export function normalizeAction(action: ActionType, input: ActionInput): string {
  if (action === 'cs_receive_payment') {
    return 'record_repair_payment'
  }
  if (action === 'cs_close_job') {
    return 'cs_close'
  }
  if (action === 'cs_return_only') {
    input.pickupOption = 'RETURN_ONLY'
    return 'cs_close'
  }
  if (action === 'cs_trade_in') {
    input.pickupOption = 'TRADEIN'
    return 'cs_close'
  }
  return action
}

export function isValidAction(a: string): a is ActionType {
  return Object.prototype.hasOwnProperty.call(ACTIONS, a) || (ALIASES as readonly string[]).includes(a)
}
