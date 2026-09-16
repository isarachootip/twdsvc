# STEP-27 — E2E Test ครบ 12 Scenario

← [STEP-26](STEP-26_executive.md) · [สารบัญ](README.md) · ถัดไป → [STEP-28 — Security, Performance และ Production Build](STEP-28_hardening.md)

**เป้าหมาย:** มีชุดทดสอบอัตโนมัติยืนยันว่าระบบทั้งเส้นทางทำงานถูก
**เอกสารอ้างอิง:** docs/09_implementation_plan.md (ตาราง E2E Test Scenarios)
**ต้องผ่านก่อน:** tag `step-26`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/09_implementation_plan.md (ตาราง E2E Test Scenarios)

## งานของ Step 27 — E2E Test ครบ 12 Scenario
เป้าหมาย: มีชุดทดสอบอัตโนมัติยืนยันว่าระบบทั้งเส้นทางทำงานถูก

ขอบเขตงาน:
1. ตั้ง Playwright ใน `apps/web/e2e` + ฐานข้อมูลทดสอบแยก (reset + seed ก่อนรัน) + fake clock สำหรับ SLA
2. เขียน E2E-01 ถึง E2E-12 ผ่านหน้าจอจริง (login หลาย role ใน test เดียว, ภาพใช้ไฟล์ fixture)
3. เพิ่ม GitHub Actions: lint, typecheck, unit, integration, e2e (มี postgres/redis/minio service)
4. ถ้าเจอ bug ระหว่างเขียน test ให้แก้ bug และระบุในสรุป

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
| 1 | `pnpm e2e` | ผ่าน 12/12 | ☐ |
| 2 | `pnpm e2e --ui` เปิดดู E2E-01 | เห็น flow ครบตั้งแต่เปิดงานถึงจ่าย VD | ☐ |
| 3 | push ขึ้น GitHub | CI เขียวทั้งหมด | ☐ |
| 4 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "test(e2e): full workflow scenarios and CI pipeline"
git tag step-27
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-26 && git clean -fd`
