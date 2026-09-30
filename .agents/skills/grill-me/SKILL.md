---
name: grill-me
description: Conducts an intense Socratic questioning interview to clarify ambiguous requirements, expose architectural edge cases, and align design decisions before any code is written.
---

# /grill-me — Socratic Design & Requirements Interrogation

Use this skill whenever the user proposes a new feature, architecture change, or significant refactoring. Do NOT write implementation code during this phase.

## Objective
Uncover hidden assumptions, missing edge cases, error states, and UX ambiguities so that the resulting implementation plan is rock solid.

## Protocol

1. **Acknowledge the Goal**: Summarize your understanding of the user's objective in 2-3 sentences.
2. **Conduct the Interview**:
   Ask 3 to 5 targeted, high-leverage questions covering:
   - **Edge Cases & Failure Modes**: What happens when network fails, external API is down, or input is malformed?
   - **Data & Relationships**: How does this impact existing Prisma schemas, migrations, and cascade deletes?
   - **Auth & Access Control**: Which user roles have permission to perform this action?
   - **State & UI Feedback**: Loading states, optimistic updates, error toasts, and rollback mechanisms.
3. **Iterate**:
   Wait for user responses. Refine questions if answers reveal new complexities.
4. **Conclusion**:
   Once aligned, summarize the agreed specification and recommend transitioning to `/plan` or `/writing-plans` to generate actionable micro-tasks.
