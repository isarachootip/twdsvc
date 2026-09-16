# STEP-11 — Job Engine ส่วนที่ 1 (เปิดงาน → สินค้าถึง VD)

← [STEP-10](STEP-10_admin-2.md) · [สารบัญ](README.md) · ถัดไป → [STEP-12 — Job Engine ส่วนที่ 2 (เสนอราคา → ปิดงาน) + SLA cron + demo data](STEP-12_engine-2.md)

**เป้าหมาย:** หัวใจของระบบ: เปลี่ยนสถานะงานได้ถูกต้องตาม state machine
**เอกสารอ้างอิง:** docs/04_workflow_state_machine.md ทั้งไฟล์, docs/05_business_rules.md §1, §3, §4, docs/06_api.md §3.1 และ §3.3
**ต้องผ่านก่อน:** tag `step-10`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/04_workflow_state_machine.md ทั้งไฟล์, docs/05_business_rules.md §1, §3, §4, docs/06_api.md §3.1 และ §3.3

## งานของ Step 11 — Job Engine ส่วนที่ 1 (เปิดงาน → สินค้าถึง VD)
เป้าหมาย: หัวใจของระบบ: เปลี่ยนสถานะงานได้ถูกต้องตาม state machine

ขอบเขตงาน:
1. สร้าง `JobEngine.execute(jobId, action, input, actor)` ตาม pseudo code 04 §3.2: ตรวจ role/scope/stage/version → validate → JobEvent → link attachments → effects → update stage → SLA clocks (ใช้ `planClockOps` จาก shared) → outbox — ทั้งหมดใน transaction เดียว
2. Registry ของ action แบบประกาศ (declarative) ไฟล์ละ action
3. Implement action: `open` (ผ่าน `JobsService.create` ที่ gen jobNo, resolveRouting, JobCharge, intake Payment, token TRACKING), `record_intake_payment`, `assign_vendor`, `gr_receive`, `gr_pack`, `dispatch_pickup`, `gr_handoff`, `carrier_confirm_pickup`, `dc_receive_outbound`, `dc_handoff_vd`, `vd_receive`, `tpl.picked_up`, `tpl.delivered`, `cancel`
4. Shipment legs ตาม 04 §4, LocationAssignment assign/clear, ใบปะหน้า/3PL booking ผ่าน mock
5. Endpoints: `POST /jobs`, `POST /jobs/preview-fees`, `POST /jobs/:id/actions/:action`, `GET /jobs/:id/allowed-actions`, `POST /webhooks/3pl` (error code ตาม 06 §0)
6. Integration test (DB จริงใน docker): เดินงานครบ 3 channel จนถึง `VD_INSPECTING`; ทุก action ที่ผิด stage ต้องได้ `INVALID_STAGE`; ขาดภาพ → `PHOTO_REQUIRED`; ขาด Location → `LOCATION_REQUIRED`; ยังไม่จ่ายค่าดำเนินการ → `BALANCE_OUTSTANDING`; version เก่า → 409

นอกขอบเขต step นี้: ยังไม่ทำหน้าจอ

กติกา:
- ทำเฉพาะขอบเขตของ step นี้ ห้ามทำงานของ step ถัดไปล่วงหน้า
- ถ้าเอกสารไม่ชัดหรือขัดกัน ให้เลือกตามลำดับความจริงใน AGENTS.md และจดคำถามไว้ใน docs/OPEN_QUESTIONS.md
- เมื่อเสร็จ ให้รัน `pnpm lint && pnpm typecheck && pnpm test` จนผ่าน
- ห้าม git commit (ผมจะตรวจแล้ว commit เอง)

เมื่อเสร็จให้สรุป: (1) ไฟล์ที่สร้าง/แก้ (2) วิธีทดสอบด้วยมือทีละข้อ (3) สิ่งที่ยังไม่ได้ทำหรือคำถามค้าง
````

## ③ ตรวจผลด้วยตัวเอง (ติ๊กให้ครบก่อนไป step ถัดไป)
| # | ทำอะไร | ต้องเห็นอะไร | ผ่าน |
|---|--------|--------------|:----:|
| 1 | `pnpm --filter api test` | integration test ผ่าน ครอบคลุม DC / DSD / 3PL | ☐ |
| 2 | ดูตาราง JobEvent ของงานทดสอบ | มี event เรียงครบทุกขั้น พร้อม actorRole | ☐ |
| 3 | ดูตาราง SlaClock | clock `CS_HANDOVER`, `GR_PACK` ถูก stop และ clock ขั้นปัจจุบัน RUNNING | ☐ |
| 4 | ค้นหาใน code ว่ามี `stage:` ถูก update นอก JobEngine ไหม | ไม่มี | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(jobs): job engine core and intake-to-vendor actions"
git tag step-11
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-10 && git clean -fd`
