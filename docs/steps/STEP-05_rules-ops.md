# STEP-05 — Business Rules ส่วนงาน (routing, SLA, โปร, จ่าย VD)

← [STEP-04](STEP-04_rules-money.md) · [สารบัญ](README.md) · ถัดไป → [STEP-06 — Design System & Component กลาง](STEP-06_ui-kit.md)

**เป้าหมาย:** logic หลักที่ซับซ้อนทั้งหมดอยู่ใน pure function พร้อม test
**เอกสารอ้างอิง:** docs/05_business_rules.md §3, §4, §6, §7
**ต้องผ่านก่อน:** tag `step-04`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/05_business_rules.md §3, §4, §6, §7

## งานของ Step 05 — Business Rules ส่วนงาน (routing, SLA, โปร, จ่าย VD)
เป้าหมาย: logic หลักที่ซับซ้อนทั้งหมดอยู่ใน pure function พร้อม test

ขอบเขตงาน:
1. `rules/routing.ts`: `resolveRouting` ตาม 05 §3 (primary → backup → zone fallback → null) + `assertCompatible` method/channel
2. `rules/sla.ts`: `planClockOps(steps, job, event)` คืนรายการ start/stop/pause/resume (ไม่แตะ DB), `resolveOwner`, `computeDueAt`, `jobSlaView(clocks, now)` คืน hoursInStep/isOverdue/overdueOwner ตาม 05 §4.2–4.4, `parseSlaInput('2 วัน')→48`
3. `rules/promo.ts`: `bestPromotion` ตาม 05 §6.1
4. `rules/payout.ts`: `calcPayoutLine`, `groupPayout(view)` ตาม 05 §7
5. Unit test: promo 4 เคสใน 05 §6.1, routing (primary ไม่รับแบรนด์ → backup, EXPRESS → TPL, หาไม่เจอ → null, DSD center + channel DC → error), SLA (VD_REPAIR ใช้ override วัน, pause 48 ชม. dueAt เลื่อน, QUOTE_REVISED restart, owner CARRIER ของแต่ละ channel), payout 1,200 × 18% = 984

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
| 2 | coverage โฟลเดอร์ rules | ≥ 95% | ☐ |
| 3 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(shared): routing, sla, promotion, payout rules"
git tag step-05
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-04 && git clean -fd`
