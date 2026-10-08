---
name: test-triage-report
description: Step-by-step procedure to run the VService Repair System verification pipeline (tsc, npm test with tier/suite filters, unregistered unit tests) and turn the output into a triaged failure report. Used by the tester agent; also usable directly.
---

# Test Triage Report — Procedure

## 0. Pre-flight (ENV checks)
- Confirm `.env` exists and `DATABASE_URL` is set (do **not** print its value).
- Many suites hit PostgreSQL through `src/lib/db.ts`. If the first DB-backed test
  fails with a connection error, classify everything downstream as **ENV** and stop
  re-running — report it instead of chasing individual failures.
- Run `npx prisma generate` only if errors mention a missing/outdated Prisma Client.

## 1. Type Check
```powershell
npx tsc --noEmit
```
- Record the error count and each `file(line,col): error TSxxxx` entry.
- Group errors by file; a cascade from one root type usually shows up as many lines.

## 2. Main Suite (`tests/run-all.ts` → `tests/runner.ts`)
```powershell
npm test                        # everything registered in runner.ts
npm test -- --tier=2            # substring match on setTier('Tier 2')
npm test -- --suite=SLA         # substring match on describe(...) name
```
Tier map:
| Tier | Folder | Focus |
|---|---|---|
| 1 | `tests/e2e/tier1-features/` | Feature coverage 1–25 |
| 2 | `tests/e2e/tier2-boundaries/` | Boundary & corner cases |
| 3 | `tests/e2e/tier3-combinations/` | Cross-feature flows A–D |
| 4 | `tests/e2e/tier4-scenarios/` | Real-world scenarios 1–5 |
| 5 | `tests/e2e/tier5-adversarial/` | Adversarial stress |

## 3. Unregistered Unit Tests
List unit files that `tests/runner.ts` does not import, then run each one:
```powershell
$registered = Select-String -Path tests\runner.ts -Pattern "unit/([\w-]+)\.test" -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value }
Get-ChildItem tests\unit\*.test.ts | Where-Object { $registered -notcontains $_.BaseName.Replace('.test','') } |
  ForEach-Object { Write-Host "== $($_.Name)"; npx tsx $_.FullName; Write-Host "exit=$LASTEXITCODE" }
```
- Some files use `tests/framework/core.ts` (`describe/it`) and only register tests;
  if a file prints nothing and exits 0, note it as **"not self-executing"** rather
  than PASS.
- Files using `node:assert` throw on failure → non-zero exit = FAIL.

## 4. Triage Each Failure
For every failing test:
1. Open the test at the failing line; identify the asserted behaviour.
2. Find the expected value's source: `tests/framework/oracle.ts`,
   `docs/USER_MANUAL_AND_KM.md`, or the business rule referenced in the test.
3. Open the product code under test (`src/lib/...`, `src/app/api/...`).
4. Classify:
   - **TYPE** — compile error.
   - **PRODUCT** — test agrees with spec/oracle; code does not.
   - **TEST** — test contradicts spec/oracle or targets a renamed/removed API.
   - **ENV** — DB/env/network/port problem.
5. Write a one-sentence root-cause hypothesis with `file:line` evidence and a
   confidence level (high / medium / low).

Only for **TEST** with high confidence may you edit the test file. Re-run that
single suite afterwards to prove the fix.

## 5. Report Template
```markdown
## Test Report — <date> — <scope>

**Summary:** tsc: FAIL (3 errors) · suite: 412 passed / 5 failed · unit extra: 13/15 · env: OK

### Failures
| # | Test | Location | Category | Hypothesis (confidence) |
|---|------|----------|----------|-------------------------|
| 1 | SLA pause shifts due date | tests/e2e/tier2-boundaries/boundary_sla_clocks.test.ts:88 | PRODUCT | `src/lib/sla/...:42` ignores pause window (high) |

### Suggested Fixes (not applied)
1. `src/lib/...:42` — <what to change and why>

### Test Edits Made
- None | <file> — <change> — <justification with spec reference>

### Coverage Gaps
- <behaviour without a test>
```

## Do / Don't
- Do quote only the relevant log lines (≤ 10 per failure).
- Do re-run a flaky-looking test once before classifying; report flakiness.
- Don't modify `src/`, `prisma/`, config, or `.env*`.
- Don't weaken assertions, skip tests, or delete tests.
