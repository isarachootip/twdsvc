# STEP-12 — Job Engine ส่วนที่ 2 (เสนอราคา → ปิดงาน) + SLA cron + demo data

← [STEP-11](STEP-11_engine-1.md) · [สารบัญ](README.md) · ถัดไป → [STEP-13 — หน้าจอ CS เปิดใบแจ้งซ่อม](STEP-13_cs-open.md)

**เป้าหมาย:** state machine ครบทุก action และมีงานตัวอย่างทุกสถานะไว้ทดสอบหน้าจอ
**เอกสารอ้างอิง:** docs/04_workflow_state_machine.md §3–5, docs/05_business_rules.md §1.3, §2, §4.3
**ต้องผ่านก่อน:** tag `step-11`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/04_workflow_state_machine.md §3–5, docs/05_business_rules.md §1.3, §2, §4.3

## งานของ Step 12 — Job Engine ส่วนที่ 2 (เสนอราคา → ปิดงาน) + SLA cron + demo data
เป้าหมาย: state machine ครบทุก action และมีงานตัวอย่างทุกสถานะไว้ทดสอบหน้าจอ

ขอบเขตงาน:
1. Implement action: `vd_submit_quote` (auto approve ถ้า total=0), `vd_revise_quote`, `customer_approve`, `customer_reject`, `cs_record_decision`, `vd_start_repair`, `vd_pause_parts`, `vd_resume_parts`, `vd_finish_repair`, `vd_return_pack` (3 channel), `dc_receive_inbound`, `dc_dispatch_confirm`, `gr_receive_return`, `gr_deliver_cs`, `record_repair_payment`, `cs_close`
2. `POST /stock-jobs` (S2) + ความต่างของ STOCK ตาม 04 §5
3. `POST /webhooks/payment` (idempotent ด้วย providerRef)
4. Cron `sla.scan` ทุก 5 นาที (ตั้ง breached + event SLA_BREACHED), cron `quote.expire` รายชั่วโมง
5. Script `pnpm db:seed:demo`: สร้างงานผ่าน JobEngine (ไม่ insert ตรง) ให้มีงานค้างอยู่ทุก stage อย่างน้อย stage ละ 1 งาน ใช้ชื่อลูกค้า/สินค้าจาก `docs/prototypes/dashboard.html` และมีบางงานเกิน SLA (เลื่อนเวลาย้อนหลัง)
6. Integration test: E2E-01, E2E-02, E2E-04, E2E-06, E2E-07 ใน 09 ระดับ service (ยังไม่ใช่ browser) และตรวจยอด balance/charges ตรงเอกสาร

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
| 1 | `pnpm --filter api test` | ผ่านทั้งหมด | ☐ |
| 2 | `pnpm db:seed:demo` แล้วดู Job ใน studio | มีทุก stage และบางงาน SlaClock breached=true | ☐ |
| 3 | งานจาก E2E-01 ใน DB | balance ก่อนรับชำระ = 98400 สตางค์, ปิดงานได้เมื่อจ่ายครบเท่านั้น | ☐ |
| 4 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(jobs): quote-to-close actions, stock jobs, sla cron, demo seed"
git tag step-12
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-11 && git clean -fd`
