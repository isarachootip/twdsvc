/**
 * Thai Watsadu Repair Center System (SVCM)
 * Master Opaque-Box E2E Test Runner
 * Tiers 1-4 Complete Requirement Coverage
 */

import { runTests, getRegistryCount } from './framework/core'

// Tier 1: Feature Coverage (Features 1-25)
import './e2e/tier1-features/features01_to_05.test'
import './e2e/tier1-features/features06_to_10.test'
import './e2e/tier1-features/features11_to_15.test'
import './e2e/tier1-features/features16_to_20.test'
import './e2e/tier1-features/features21_to_25.test'
import './e2e/tier1-features/admin_full_access.test'
import './e2e/tier1-features/customer_service_view.test'
import './unit/number-generator.test'
import './unit/commodities_api.test'

// Tier 2: Boundary & Corner Cases
import './e2e/tier2-boundaries/boundary_financial_satang.test'
import './e2e/tier2-boundaries/boundary_sla_clocks.test'
import './e2e/tier2-boundaries/boundary_security_tokens.test'
import './e2e/tier2-boundaries/boundary_location_coordinates.test'
import './e2e/tier2-boundaries/boundary_state_transitions.test'
import './e2e/tier2-boundaries/boundary_search_and_inputs.test'
import './e2e/tier2-boundaries/boundary_payout_and_admin.test'
import './e2e/tier2-boundaries/boundary_concurrency_locking.test'
import './e2e/tier2-boundaries/boundary_production_engine.test'
import './e2e/tier2-boundaries/boundary_pg_integration.test'
import './e2e/tier2-boundaries/boundary_reports_empirical.test'
import './e2e/tier2-boundaries/boundary_intake_payment_flow.test'
import './e2e/tier2-boundaries/boundary_branch_crud.test'

// Tier 3: Cross-Feature Combinations (Pairwise Flows A, B, C, D)
import './e2e/tier3-combinations/flow_a_standard_repair.test'
import './e2e/tier3-combinations/flow_b_quote_rejected.test'
import './e2e/tier3-combinations/flow_c_stock_repair.test'
import './e2e/tier3-combinations/flow_d_tradein_coupon.test'

// Tier 4: Real-World Application Scenarios (1-5)
import './e2e/tier4-scenarios/scenario_1_powertool_express.test'
import './e2e/tier4-scenarios/scenario_2_lawnmower_parts_delay.test'
import './e2e/tier4-scenarios/scenario_3_bulk_stock_triage.test'
import './e2e/tier4-scenarios/scenario_4_payout_reconciliation.test'
import './e2e/tier4-scenarios/scenario_5_multitenant_stress.test'

// Tier 5: Adversarial Stress Testing & White-Box Hardening
import './e2e/tier5-adversarial/challenger_m6_1_stress.test'
import './e2e/tier5-adversarial/challenger_m6_2_stress.test'

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

export async function executeE2ETestSuite(options: { tierFilter?: string; suiteFilter?: string } = {}) {
  console.log(`\n${ANSI.bold}${ANSI.cyan}========================================================================${ANSI.reset}`)
  console.log(`${ANSI.bold}${ANSI.cyan}       Thai Watsadu Repair Center System (SVCM) - E2E Test Suite        ${ANSI.reset}`)
  console.log(`${ANSI.bold}${ANSI.cyan}          Opaque-Box Requirement Verification (Tiers 1-4)               ${ANSI.reset}`)
  console.log(`${ANSI.bold}${ANSI.cyan}========================================================================${ANSI.reset}\n`)

  const totalRegistered = getRegistryCount()
  console.log(`${ANSI.gray}Total registered test cases: ${totalRegistered}${ANSI.reset}`)
  if (options.tierFilter) console.log(`${ANSI.yellow}Filter Tier: "${options.tierFilter}"${ANSI.reset}`)
  if (options.suiteFilter) console.log(`${ANSI.yellow}Filter Suite: "${options.suiteFilter}"${ANSI.reset}`)

  console.log(`\n${ANSI.bold}Executing Test Suites...${ANSI.reset}\n`)

  const { results, stats } = await runTests(options)

  // Group by Tier
  const tiers = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5']
  for (const tier of tiers) {
    const tierResults = results.filter((r) => r.tier === tier)
    if (tierResults.length === 0) continue

    const tierPassed = tierResults.filter((r) => r.passed).length
    const tierFailed = tierResults.filter((r) => !r.passed).length
    const statusColor = tierFailed === 0 ? ANSI.green : ANSI.red

    console.log(
      `${ANSI.bold}${tier}${ANSI.reset}: ${statusColor}${tierPassed}/${tierResults.length} passed${ANSI.reset} ${
        tierFailed > 0 ? `(${tierFailed} failed)` : ''
      }`
    )

    // Group by Suite within Tier
    const suites = Array.from(new Set(tierResults.map((r) => r.suite)))
    for (const suite of suites) {
      const suiteResults = tierResults.filter((r) => r.suite === suite)
      const suitePassed = suiteResults.filter((r) => r.passed).length
      const suiteFailed = suiteResults.filter((r) => !r.passed).length
      const icon = suiteFailed === 0 ? `${ANSI.green}✓${ANSI.reset}` : `${ANSI.red}✗${ANSI.reset}`
      console.log(`  ${icon} ${ANSI.gray}${suite}:${ANSI.reset} ${suitePassed}/${suiteResults.length}`)
    }
  }

  // Print Failures if any
  const failures = results.filter((r) => !r.passed)
  if (failures.length > 0) {
    console.log(`\n${ANSI.bold}${ANSI.red}------------------------------------------------------------------------${ANSI.reset}`)
    console.log(`${ANSI.bold}${ANSI.red}                          FAILURES REPORT                               ${ANSI.reset}`)
    console.log(`${ANSI.bold}${ANSI.red}------------------------------------------------------------------------${ANSI.reset}\n`)

    for (const f of failures) {
      console.log(`${ANSI.red}✗ [${f.tier}] ${f.suite} > ${f.name}${ANSI.reset}`)
      if (f.error) {
        console.log(`  ${ANSI.yellow}${f.error.message}${ANSI.reset}`)
        if (f.error.stack) {
          const stackLines = f.error.stack.split('\n').slice(1, 4).join('\n')
          console.log(`  ${ANSI.gray}${stackLines}${ANSI.reset}`)
        }
      }
      console.log('')
    }
  }

  // Final Summary Box
  console.log(`\n${ANSI.bold}${ANSI.cyan}========================================================================${ANSI.reset}`)
  console.log(`${ANSI.bold}Execution Summary:${ANSI.reset}`)
  console.log(`  Total Tests  : ${ANSI.bold}${stats.total}${ANSI.reset}`)
  console.log(`  Passed       : ${ANSI.green}${ANSI.bold}${stats.passed}${ANSI.reset}`)
  console.log(`  Failed       : ${stats.failed > 0 ? ANSI.red : ANSI.green}${ANSI.bold}${stats.failed}${ANSI.reset}`)
  console.log(`  Duration     : ${ANSI.cyan}${stats.durationMs}ms${ANSI.reset}`)
  console.log(`  Pass Rate    : ${stats.failed === 0 ? ANSI.green : ANSI.red}${ANSI.bold}${(
    (stats.passed / (stats.total || 1)) *
    100
  ).toFixed(1)}%${ANSI.reset}`)
  console.log(`${ANSI.bold}${ANSI.cyan}========================================================================${ANSI.reset}\n`)

  return stats
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2)
  const tierArg = args.find((a) => a.startsWith('--tier='))?.split('=')[1]
  const suiteArg = args.find((a) => a.startsWith('--suite='))?.split('=')[1]

  executeE2ETestSuite({ tierFilter: tierArg, suiteFilter: suiteArg })
    .then((stats) => {
      process.exit(stats.failed > 0 ? 1 : 0)
    })
    .catch((err) => {
      console.error('Test execution error:', err)
      process.exit(1)
    })
}
