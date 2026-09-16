# STEP-04 — Business Rules ส่วนเงิน (pure functions)

← [STEP-03](STEP-03_seed.md) · [สารบัญ](README.md) · ถัดไป → [STEP-05 — Business Rules ส่วนงาน (routing, SLA, โปร, จ่าย VD)](STEP-05_rules-ops.md)

**เป้าหมาย:** มีฟังก์ชันคำนวณเงินที่ถูกต้องและมี test ครอบคลุม
**เอกสารอ้างอิง:** docs/05_business_rules.md §1, §2, §5, docs/09_implementation_plan.md (ตัวเลข E2E-01)
**ต้องผ่านก่อน:** tag `step-03`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/05_business_rules.md §1, §2, §5, docs/09_implementation_plan.md (ตัวเลข E2E-01)

## งานของ Step 04 — Business Rules ส่วนเงิน (pure functions)
เป้าหมาย: มีฟังก์ชันคำนวณเงินที่ถูกต้องและมี test ครอบคลุม

ขอบเขตงาน:
1. `packages/shared/src/rules/money.ts`: satang ↔ baht, `roundHalfUp`, `formatBaht` (฿1,234 / ฿1,234.50), วันที่ไทย (พ.ศ.)
2. `rules/fees.ts`: `calcIntakeFees` ตาม 05 §1.1 + `calcBalance` ตาม 05 §1.3 (รองรับ charge3plReturnFee)
3. `rules/quote.ts`: `buildInspectionLine`, `calcQuoteTotals`, `estimatedDays` ตาม 05 §2
4. `rules/running-no.ts`: `formatRunningNo(prefix, date, seq)` ใช้เวลา Asia/Bangkok
5. zod schema ของ input/output ไว้ใน `packages/shared/src/schemas`
6. Unit test: ตาราง 4 กรณีใน 05 §1.1 × 2 ขนาด, ตัวอย่าง balance ฿900 ใน 05 §1.3, ตัวอย่างใบเสนอราคา ฿963 ใน 05 §2.2, ตัวเลข E2E-01 (1,284 / 984), running no ข้ามเดือนตอนเที่ยงคืนเวลาไทย

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
| 1 | `pnpm --filter shared test` | ผ่านทั้งหมด | ☐ |
| 2 | `pnpm --filter shared test -- --coverage` | โฟลเดอร์ `rules` coverage ≥ 95% | ☐ |
| 3 | เปิดไฟล์ test อ่านผ่านๆ | มีเคส 963 และ 900 ตามเอกสารจริง | ☐ |
| 4 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(shared): money, fees, quote, running-number rules"
git tag step-04
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-03 && git clean -fd`
