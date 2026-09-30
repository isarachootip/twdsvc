# Engineering Standards & Architectural Guardrails

> This repository adheres to strict Software Engineering principles to prevent hasty, monolithic, or unmaintainable code generation. All AI coding agents (especially fast reasoning models) must operate under these guardrails.

---

## 1. Anti-Haste & Alignment Protocol
- **No Unplanned Multi-File Changes**: NEVER jump directly into editing or creating multiple files without presenting a clear architectural breakdown or task list first.
- **Artifact First**: For non-trivial features or refactoring, produce an **Implementation Plan** or **Task List** as an Antigravity Artifact before touching the code.
- **Clarification Over Assumption**: If requirements, edge cases, or database relationships are underspecified, stop and ask or use Socratic questioning to align with the user.

---

## 2. Modularity & Clean Architecture
- **Max File Length (150–200 Lines)**: No single source file should exceed 200 lines. If a component or module grows beyond this, extract sub-components, custom hooks, or utility helpers.
- **Separation of Concerns (Next.js 15 & Prisma)**:
  - **UI Layer (`src/components/`, `src/app/**/page.tsx`)**: Pure presentation, user interaction, and client-side state. Never place raw Prisma queries or complex business logic inside Client Components (`"use client"`).
  - **Business / Domain Layer (`src/lib/services/` or `src/lib/`)**: Pure functions, calculations, workflow rules, and validations.
  - **Data Access Layer (`prisma/`, `src/lib/db.ts`)**: Database interactions encapsulated with type-safe operations.
  - **API / Server Actions Layer**: Input validation using Zod, authentication verification via session/JWT, error catching, and delegating to domain services.
- **Single Responsibility Principle (SRP)**: Each function, hook, and component must do exactly one thing well.
- **No God Files**: Avoid dumping disparate helper utilities into a single monolithic `utils.ts`. Split into focused modules (e.g., `date-utils.ts`, `currency-utils.ts`, `qr-utils.ts`).

---

## 3. Strict Type Safety & Validation
- **Zero `any` Policy**: Never use `any`. Define explicit TypeScript interfaces/types or use `unknown` with type guards.
- **Zod for Boundaries**: All external boundaries (API request bodies, query params, form submissions, environment variables) must be parsed and validated with Zod schemas.
- **Type-Check Verification**: After modifying TypeScript files, verify type integrity by running:
  ```bash
  npx tsc --noEmit
  ```

---

## 4. Test-Driven Development (TDD) & Quality Verification
- **Red-Green-Refactor**: For any core business logic, bug fix, or service function:
  1. Write or identify a failing test in `tests/`.
  2. Implement the minimal clean code to make the test pass.
  3. Refactor for modularity and readability while keeping tests green.
- **Verification Command**:
  ```bash
  npm test
  # or
  npx tsx tests/run-all.ts
  ```
- **Never Deliver Broken Code**: Before declaring a task finished, ensure both the test suite passes and there are no TypeScript compiler errors.

---

## 5. Safe Git Operations
- **Forbidden Commands**: NEVER run destructive git commands automatically (`git push --force`, `git reset --hard`, `git checkout .`, `git clean -fd`) without explicit user permission.
- **Feature Branching**: When working on large features or breaking changes, suggest creating an isolated branch or worktree.
