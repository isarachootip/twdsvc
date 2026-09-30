---
name: tdd-workflow
description: Enforces the Red-Green-Refactor test-driven development workflow to ensure bug-free, verified, and maintainable implementation.
---

# /tdd-workflow — Red-Green-Refactor Loop

Use this skill whenever implementing non-trivial business logic, pricing/calculation algorithms, state transitions, or bug fixes.

## Strict Sequence

### Step 1: RED (Write Failing Test First)
- Create or update a test file in `tests/`.
- Specify the expected behavior and edge cases.
- Run the test command:
  ```bash
  npx tsx tests/run-all.ts
  ```
- **Crucial**: Confirm that the test actually FAILS with the expected reason. If it passes before you write the code, your test is invalid.

### Step 2: GREEN (Write Minimal Working Code)
- Implement only the minimal code necessary in the appropriate domain service (`src/lib/...`) to satisfy the failing test.
- Re-run the test to confirm it turns GREEN:
  ```bash
  npx tsx tests/run-all.ts
  ```

### Step 3: REFACTOR (Ensure Modularity & Clean Code)
- Clean up the implementation:
  - Check file length (must be under 200 lines).
  - Extract reusable helpers if duplicated.
  - Ensure zero `any` types and run:
    ```bash
    npx tsc --noEmit
    ```
- Re-run the tests to prove that refactoring didn't break any existing functionality.
