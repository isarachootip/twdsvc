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

## 5. Safe Git Operations & Automatic Remote Sync
- **Always Commit, Push & Report Result**: ทุกครั้งหลังทดสอบโค้ดเสร็จสมบูรณ์ (`npx tsc --noEmit` และ `npm test` ผ่าน 100%) ให้ทำการ `git add`, `git commit` ด้วยข้อความที่สื่อความหมายชัดเจน และ `git push origin main` ขึ้น GitHub ทันทีโดยไม่ต้องรอถาม เพื่อให้เซิร์ฟเวอร์ CI/CD (Coolify / Production) ทำการ Build & Deploy ต่อเนื่องเสมอ **พร้อมแจ้งผลลัพธ์การ Push (Commit Hash, Commit Message, Branch และสถานะ Sync กับ Remote) ให้ผู้ใช้ทราบทุกครั้ง**
- **Forbidden Commands**: NEVER run destructive git commands automatically (`git push --force`, `git reset --hard`, `git checkout .`, `git clean -fd`) without explicit user permission.
- **Feature Branching**: When working on large features or breaking changes, suggest creating an isolated branch or worktree.

---

## 6. UI & Design System Standards (Borderless Status & Remarks)
- **Zero Pill / Bordered Box Policy**: ห้ามใส่กรอบสี่เหลี่ยมหรือกรอบวงรี (No border, rounded-full border, box shadow, or pill background) ล้อมรอบสถานะ (Status), หมายเหตุ (Remarks), หรือแท็กข้อความในทุกหน้าจอของระบบ
- **Typography & Semantic Color First**: แสดงความแตกต่างของสถานะและความเร่งด่วนด้วยสีตัวอักษรโดยตรง (Colored Typography เช่น `text-emerald-700`, `text-amber-700`, `text-rose-600`, `text-slate-600`) และสามารถใช้จุดสีสัญลักษณ์ขนาดเล็ก (`w-1.5 h-1.5 rounded-full`) ประกอบได้ โดยไม่มีกรอบกล่องครอบ
- **System-Wide Uniformity**: เงื่อนไขนี้บังคับใช้กับทุกหน้าจอและทุกโมดูลในระบบ (CS, GR, DC, VD, S2, Jobs, Admin, Customer Portal) เพื่อความสะอาดตา เรียบหรู และอ่านง่ายตามหลัก Ergonomic UI

