/**
 * Test Fixtures and Simulation Helpers for SVCM E2E Testing
 */

import { SPEC_ORACLE } from './oracle'
import { MockUser, MockJob } from './types'
import { handleIntakeLogisticsAction } from './sim-intake-logistics'
import { handleVendorSimAction } from './sim-vendor'
import { handleCloseSimAction } from './sim-close'

export * from './types'
export * from './fixtures'
export * from './db-helpers'

/**
 * State Transition Engine (Conforms strictly to 04_workflow_state_machine.md)
 */
export function simulateAction(
  job: MockJob,
  action: string,
  actor: MockUser,
  payload: Record<string, any> = {}
): { success: boolean; job?: MockJob; error?: string } {
  // Check active user
  if (!actor.active) {
    return { success: false, error: 'User is inactive' }
  }

  // Check RBAC
  const allowedRoles = SPEC_ORACLE.RBAC_MENU_MATRIX[actor.role]
  if (!allowedRoles) {
    return { success: false, error: 'Unknown role' }
  }

  // Multi-tenant data scope check (08_rbac.md §4)
  if (['CS', 'GR', 'S2'].includes(actor.role)) {
    if (actor.siteId && job.branchId !== actor.siteId) {
      return { success: false, error: '403: Cross-branch access forbidden' }
    }
  }
  if (actor.role === 'VD') {
    if (actor.vendorCenterId && job.vendorCenterId !== actor.vendorCenterId) {
      return { success: false, error: '403: Cross-vendorCenter access forbidden' }
    }
  }

  // Optimistic locking check (version)
  if (payload.expectedVersion !== undefined && payload.expectedVersion !== job.version) {
    return { success: false, error: '409: Optimistic locking conflict (stale version)' }
  }

  const updatedJob: MockJob = JSON.parse(JSON.stringify(job))
  const now = new Date()

  const intakeLogResult = handleIntakeLogisticsAction(action, updatedJob, actor, payload, now)
  if (intakeLogResult.handled) {
    if (intakeLogResult.result) return intakeLogResult.result
  } else {
    const vendorResult = handleVendorSimAction(action, updatedJob, actor, payload, now)
    if (vendorResult.handled) {
      if (vendorResult.result) return vendorResult.result
    } else {
      const closeResult = handleCloseSimAction(action, updatedJob, actor, payload, now)
      if (closeResult.handled) {
        if (closeResult.result) return closeResult.result
      } else {
        return { success: false, error: `Unknown action: ${action}` }
      }
    }
  }

  updatedJob.version++
  updatedJob.events.push({
    type: action.toUpperCase(),
    fromStage: job.stage,
    toStage: updatedJob.stage,
    timestamp: now,
    actorRole: actor.role,
  })

  return { success: true, job: updatedJob }
}
