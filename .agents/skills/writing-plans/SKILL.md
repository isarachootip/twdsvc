---
name: writing-plans
description: Generates structured, bite-sized implementation plans (2 to 5 minutes per task) with explicit file boundaries, modular design, and verification steps.
---

# /writing-plans — Micro-Planning & Modular Task Breakdown

Use this skill after requirements are clear (e.g., following `/grill-me`), but before touching any application code.

## Objective
Prevent "hasty monolithic coding" by breaking down the implementation into discrete, isolated steps that can be reviewed, executed incrementally, or dispatched to Subagents.

## Planning Format

Create an **Artifact** (`implementation_plan.md` or `task.md`) following this structure:

### 1. Architectural Overview
- High-level design summary.
- List of new files to create and existing files to modify (adhering to the < 200 lines rule).
- Module boundaries (UI vs Services vs Data Layer).

### 2. Task Breakdown (Micro-Tasks)
Each task should be small enough to complete in a single turn (2–5 minutes of focused agent execution):

- **Task 1: Data Model / Zod Schemas**
  - Files: `prisma/schema.prisma`, `src/lib/validations/...`
  - Action: Define types, schemas, and run migration if needed.
  - Verification: `npx tsc --noEmit`

- **Task 2: Domain Service / Business Logic**
  - Files: `src/lib/services/...`
  - Action: Pure business logic functions without UI ties.
  - Verification: Unit test in `tests/...`

- **Task 3: API Route / Server Action**
  - Files: `src/app/api/...`
  - Action: Input validation via Zod, authentication check, call service.
  - Verification: Integration test or curl / API test.

- **Task 4: Modular UI Components**
  - Files: `src/components/...` (Sub-components < 150 lines each).
  - Action: Connect UI to Server Action / API.
  - Verification: Visual verification, no console errors.

### 3. Review Gate
Request user feedback or confirmation before proceeding to execute Task 1.
