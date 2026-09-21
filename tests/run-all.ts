/**
 * Executable Entry Point for SVCM E2E Test Suite
 * Run via: npx tsx tests/run-all.ts
 */

import { executeE2ETestSuite } from './runner'

const args = process.argv.slice(2)
const tierArg = args.find((a) => a.startsWith('--tier='))?.split('=')[1]
const suiteArg = args.find((a) => a.startsWith('--suite='))?.split('=')[1]

executeE2ETestSuite({ tierFilter: tierArg, suiteFilter: suiteArg })
  .then((stats) => {
    if (stats.failed > 0) {
      console.error(`\x1b[31mE2E Test Run Completed with ${stats.failed} failures.\x1b[0m`)
      process.exit(1)
    } else {
      console.log(`\x1b[32mAll ${stats.passed} E2E Tests Passed Successfully!\x1b[0m`)
      process.exit(0)
    }
  })
  .catch((err) => {
    console.error('Fatal test runner error:', err)
    process.exit(1)
  })
