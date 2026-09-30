---
name: adversarial-review
description: Performs an uncompromising, adversarial code review focusing on architectural boundaries, modularity, security, performance, and line limits before completion.
---

# /adversarial-review — Strict Senior Code Review

Use this skill before closing any feature, creating a PR, or concluding a major task.

## Review Checklist

1. **Modularity & Complexity**:
   - Are any modified or created files exceeding 200 lines?
   - Did the implementation introduce monolithic functions or God objects?
   - Are UI components free of business logic and direct database queries?

2. **Type Safety & Contracts**:
   - Are there any `any` types or unvalidated `as` type assertions?
   - Are external inputs/endpoints validated with Zod schemas?
   - Does `npx tsc --noEmit` pass with zero errors?

3. **Security & Data Integrity**:
   - Are user authorizations and roles verified on every mutation?
   - Are sensitive fields sanitized or omitted from client responses?
   - Are transactions (`prisma.$transaction`) used where atomic operations are necessary?

4. **Testing & Regressions**:
   - Are there tests covering both happy path and edge cases?
   - Do all automated tests pass (`npx tsx tests/run-all.ts`)?

## Review Output
Provide an assessment with:
- **Verdict**: `APPROVED` or `CHANGES_REQUESTED`
- **Critical Issues**: Must fix before merging.
- **Modularity Suggestions**: Opportunities to break into cleaner components or helpers.
