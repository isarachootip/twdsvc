---
name: role-training-kit
description: Procedure and templates for producing a Thai training kit (guide, exercises, quiz, demo script) for one VService Repair System role under docs/training/<role>/. Used by the trainer agent; also usable directly.
---

# Role Training Kit — Procedure

## 1. Scope
- Target role: one of `cs`, `gr`, `dc`, `vd`, `s2`, `admin`, `executive`
  (folder names are lowercase).
- Trainee level: **new hire** (default) or **refresher** (skip basics, focus on
  exceptions and KM articles).

## 2. Fact Gathering
1. Read the role's section in `docs/USER_MANUAL_AND_KM.md` (section 4.x) and the
   demo account row in section 3.
2. List the role's routes from `src/app/` (e.g. `src/app/cs/**/page.tsx`) and skim
   the components they render for exact button labels, fields and validations.
3. Note the `JobStage` values the role moves a job into or out of
   (`prisma/schema.prisma`, manual section 2).
4. Pick relevant KM articles (manual section 5) and FAQs (section 6).
5. Write down any manual ↔ code mismatch with `file:line` for the final report.

## 3. Files & Templates
Write to `docs/training/<role>/`. Each file ≤ 200 lines.

### `01-guide.md`
```markdown
# คู่มืออบรม: <ชื่อบทบาท> (<ROLE>)
> ระดับ: พนักงานใหม่ · เวลาเรียนโดยประมาณ: <x> นาที

## วัตถุประสงค์การเรียนรู้
- เมื่อจบบทเรียน ผู้เรียนสามารถ ... (3–5 ข้อ, วัดผลได้)

## ภาพรวมหน้าที่
<2–3 ประโยค + ตำแหน่งของบทบาทใน flow สถานะงาน>

## งานที่ 1: <ชื่องาน> (`/route`)
1. ...
2. ...
> ⚠️ ข้อควรระวัง: ...

## สถานะงานที่เกี่ยวข้อง
| สถานะ | ความหมาย | ใครทำต่อ |

## อ้างอิง
- คู่มือหลัก หัวข้อ 4.x, KM-0x
```

### `02-exercises.md`
- 3–6 exercises, increasing difficulty, each with:
  **โจทย์**, **บัญชีที่ใช้** (username only — see manual section 3 for password),
  **ขั้นตอนที่คาดหวัง**, **ผลลัพธ์ที่ถูกต้อง** (what the screen/status should show).
- Include at least one exception case (e.g. quotation rejected, SLA overdue).

### `03-quiz.md`
- 10–15 questions: multiple choice + scenario questions.
- Answer key at the end in a separate section `## เฉลย`, each answer citing the
  manual section or route.

### `04-demo-script.md`
```markdown
| เวลา | ผู้สอนพูด | ผู้สอนทำบนหน้าจอ | จุดที่ต้องเน้น |
|------|-----------|-------------------|----------------|
| 0:00 | ... | เข้า `/login` ด้วย test_xx | ... |
```
- 15–25 minutes total; end with a Q&A prompt list.

## 4. Self-Check (must pass before reporting)
- [ ] Every route mentioned exists under `src/app/`.
- [ ] Button/field names match the code, not just the manual.
- [ ] No passwords, secrets, or real customer data in the files.
- [ ] Status codes match `JobStage` exactly.
- [ ] Each file ≤ 200 lines; Thai language; numbered steps.
- [ ] Discrepancies recorded for the final report.

## 5. Optional: Index
If more than one role exists in `docs/training/`, create/update
`docs/training/README.md` with a table linking every role's four files.
