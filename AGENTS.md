# AGENTS.md — กติกาสำหรับ AI Coding Agent (SVCM)

> วางไฟล์นี้ที่ root ของ repo (คัดลอกเป็น `CLAUDE.md` ได้) และวางเอกสารทั้งชุดไว้ใน `docs/`

## บริบท
ระบบศูนย์บริการซ่อมไทวัสดุ — อ่าน `docs/README.md` → `01_overview.md` ก่อนเริ่มงานใดๆ
Prototype HTML ใน `docs/prototypes/` คือ **reference ด้าน UI** เท่านั้น (ข้อมูล mock, logic บางส่วนผิด — ดู 01 §6)

## ลำดับความจริง (Source of truth)
1. เอกสารใน `docs/0x_*.md` 2. zod schema ใน `packages/shared` 3. prototype HTML
ถ้าขัดกัน ให้ยึดลำดับนี้ และถ้าเอกสารไม่ครอบคลุม **ให้หยุดและบันทึกคำถามใน `docs/OPEN_QUESTIONS.md`** แทนการเดา business rule

## Commands
```bash
pnpm i
docker compose up -d          # postgres, redis, minio
pnpm db:migrate && pnpm db:seed
pnpm dev                      # web :3000, api :4000
pnpm test                     # vitest ทุก package
pnpm e2e                      # playwright
pnpm lint && pnpm typecheck
```

## Hard rules
1. **เปลี่ยน `Job.stage` ผ่าน `JobEngine.execute()` เท่านั้น** — ห้าม `prisma.job.update({stage})` ที่อื่น
2. Logic เงิน/SLA/โปร/routing/payout อยู่ใน `packages/shared/src/rules` เป็น pure function + unit test; server คำนวณซ้ำเสมอ ไม่เชื่อค่าจาก client
3. เงินเก็บเป็น **สตางค์ (Int)**; ห้ามใช้ float กับเงิน; ปัด round half up
4. เวลาเก็บ UTC แสดง `Asia/Bangkok`; running number ใช้ YYMM ตามเวลาไทย
5. ทุก query ต้องผ่าน scope helper (`scopeJobsFor(user)`) — ห้าม query job ตรงโดยไม่กรอง scope
6. ทุก action ที่มีภาพ/Location บังคับ ต้อง validate ฝั่ง server (ไม่ใช่แค่ disable ปุ่ม)
7. ห้ามรับ/เก็บเลขบัตรเครดิต — ใช้ hosted payment page
8. ข้อความ UI ภาษาไทยตาม prototype/07; key i18n ภาษาอังกฤษ; ห้ามใช้คำว่า "มัดจำ" ให้ใช้ "ค่าดำเนินการ"
9. แทน `alert()` ด้วย toast/dialog; ปุ่มที่ disabled ต้องมี tooltip เหตุผล
10. ปุ่ม "จำลอง" (simulate webhook / ลูกค้ากด) แสดงเฉพาะ `NODE_ENV !== 'production'`
11. Integration ใหม่ต้องมี mock provider ก่อนเสมอ
12. Migration ห้ามแก้ของเก่า — สร้างใหม่เท่านั้น
13. เพิ่ม/เปลี่ยน enum stage, event, action → อัปเดต `04_workflow_state_machine.md` และ `05` §4 ใน PR เดียวกัน

## Conventions
- API: NestJS module ต่อ domain; controller บาง, service ถือ logic, repository ถือ Prisma
- Naming: action = snake_case (`gr_receive`), event type = UPPER_SNAKE (`GR_RECEIVED`), DB = camelCase
- Frontend: server components สำหรับหน้า list/dashboard, client components สำหรับฟอร์ม/คิวที่ interactive; data fetching ด้วย TanStack Query + typed client
- ทุกคิวใช้ `QueuePage` generic: `{ role, tabs[], columns[], actionCell }` เพื่อไม่เขียนซ้ำ GR/DC/VD
- Test naming: `rules/fees.test.ts` → `describe('calcIntakeFees')`
- Commit: Conventional Commits (`feat(jobs): add gr_pack action`)

## เมื่อทำ task
1. อ่าน task ใน `09_implementation_plan.md` + ส่วนที่อ้างอิง
2. เขียน/อัปเดต zod schema และ test ก่อน
3. Implement → รัน lint/typecheck/test
4. เปรียบเทียบ UI กับ prototype ที่เกี่ยวข้อง (เปิดไฟล์ HTML ในเบราว์เซอร์)
5. สรุปสิ่งที่ทำ + คำถามค้าง
