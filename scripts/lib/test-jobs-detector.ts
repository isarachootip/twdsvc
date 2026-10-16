import { z } from 'zod'

export interface TestJobCandidateInput {
  id: string
  jobNo: string
  customerName: string | null
  customerPhone: string | null
  productName: string
  symptom: string | null
  createdBy: string
  stage: string
  branchName: string
  openedAt: Date
  isTest: boolean
}

export interface DetectedTestJob extends TestJobCandidateInput {
  reasons: string[]
}

export interface TestJobsSnapshotEntry {
  id: string
  jobNo: string
  customerName: string | null
  isTestBefore: boolean
}

export interface TestJobsSnapshot {
  createdAt: string
  entries: TestJobsSnapshotEntry[]
}

export const testJobsSnapshotSchema = z.object({
  createdAt: z.string(),
  entries: z.array(
    z.object({
      id: z.string(),
      jobNo: z.string(),
      customerName: z.string().nullable(),
      isTestBefore: z.boolean(),
    })
  ),
})

const KNOWN_TEST_CUSTOMERS = [
  'test test',
  'tee tee',
  'ลูกค้าทดสอบ คู่มือ',
  'ลูกค้าทดสอบ',
  'นายทดสอบ ระบบ',
  'เสาวภา เเเเ',
]

const TEST_ROLE_USERNAMES = new Set([
  'test_cs',
  'test_gr',
  'test_dc',
  'test_vd',
  'test_s2',
  'test_am',
  'test_exec',
])

/**
 * Pure detector that returns human-readable reasons why a job looks like a test record.
 * Returns an empty array if the job appears to be a legitimate customer/stock job.
 */
export function detectTestJobReasons(
  job: TestJobCandidateInput,
  explicitJobNos: readonly string[] = []
): string[] {
  const reasons: string[] = []
  const explicitSet = new Set(explicitJobNos.map(n => n.trim().toUpperCase()).filter(Boolean))

  if (explicitSet.has(job.jobNo.trim().toUpperCase())) {
    reasons.push(`ระบุเลขงานตรง (${job.jobNo})`)
  }

  const rawName = (job.customerName ?? '').trim()
  const normName = rawName.toLowerCase().replace(/\s+/g, ' ')

  if (normName) {
    for (const kw of KNOWN_TEST_CUSTOMERS) {
      if (normName === kw || normName.includes(kw)) {
        reasons.push(`ชื่อลูกค้าตรงกับรายการทดสอบ ("${rawName}")`)
        break
      }
    }
    if (reasons.length === 0) {
      if (/^(test|demo|ทดสอบ)\b/i.test(normName) || /\b(test|demo)\b/i.test(normName)) {
        reasons.push(`ชื่อลูกค้ามีคำว่า test/demo/ทดสอบ ("${rawName}")`)
      } else if (/([เแไใโ])\1{2,}/.test(rawName) || /([ก-ฮa-z])\1{3,}/i.test(rawName)) {
        reasons.push(`ชื่อลูกค้ามีอักขระซ้ำผิดปกติ ("${rawName}")`)
      }
    }
  }

  const creator = (job.createdBy ?? '').trim().toLowerCase()
  if (TEST_ROLE_USERNAMES.has(creator)) {
    reasons.push(`สร้างโดยบัญชีทดสอบ (${job.createdBy})`)
  }

  const prod = (job.productName ?? '').trim().toLowerCase()
  if (prod === 'test' || prod.includes('สินค้าทดสอบ')) {
    reasons.push(`ชื่อสินค้าทดสอบ ("${job.productName}")`)
  }

  return reasons
}

export function buildMarkTestJobsPlan(
  jobs: readonly TestJobCandidateInput[],
  explicitJobNos: readonly string[] = [],
  now = new Date()
): {
  candidates: DetectedTestJob[]
  toUpdateIds: string[]
  alreadyMarkedIds: string[]
  snapshot: TestJobsSnapshot
} {
  const candidates: DetectedTestJob[] = []
  for (const j of jobs) {
    const reasons = detectTestJobReasons(j, explicitJobNos)
    if (reasons.length > 0) {
      candidates.push({ ...j, reasons })
    }
  }

  const toUpdateIds = candidates.filter(c => !c.isTest).map(c => c.id)
  const alreadyMarkedIds = candidates.filter(c => c.isTest).map(c => c.id)

  const snapshot: TestJobsSnapshot = {
    createdAt: now.toISOString(),
    entries: candidates.map(c => ({
      id: c.id,
      jobNo: c.jobNo,
      customerName: c.customerName,
      isTestBefore: c.isTest,
    })),
  }

  return { candidates, toUpdateIds, alreadyMarkedIds, snapshot }
}

export function buildRollbackTestJobsPlan(snapshot: TestJobsSnapshot): {
  setFalseIds: string[]
  setTrueIds: string[]
} {
  const parsed = testJobsSnapshotSchema.parse(snapshot)
  return {
    setFalseIds: parsed.entries.filter(e => !e.isTestBefore).map(e => e.id),
    setTrueIds: parsed.entries.filter(e => e.isTestBefore).map(e => e.id),
  }
}
