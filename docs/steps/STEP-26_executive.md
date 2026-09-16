# STEP-26 — Executive Dashboard + PDF

← [STEP-25](STEP-25_analytics.md) · [สารบัญ](README.md) · ถัดไป → [STEP-27 — E2E Test ครบ 12 Scenario](STEP-27_e2e.md)

**เป้าหมาย:** ผู้บริหารเห็นผลประกอบการ สุขภาพงาน และประเด็นที่ต้องพิจารณา
**เอกสารอ้างอิง:** docs/07_screens.md §Exec, docs/05_business_rules.md §8.1, §8.3–8.5, docs/prototypes/executive_dashboard.html
**ต้องผ่านก่อน:** tag `step-25`

---

## ① ก่อนเริ่ม
```bash
git status            # ต้องไม่มีไฟล์ค้าง (clean)
docker compose up -d  # ให้ฐานข้อมูลทำงาน
```

## ② คัดลอก Prompt นี้ไปวางใน AI Agent
````text
คุณกำลังพัฒนาระบบ SVCM ตามเอกสารในโฟลเดอร์ docs/
ก่อนเริ่ม ให้อ่าน AGENTS.md และเอกสารอ้างอิงของ step นี้: docs/07_screens.md §Exec, docs/05_business_rules.md §8.1, §8.3–8.5, docs/prototypes/executive_dashboard.html

## งานของ Step 26 — Executive Dashboard + PDF
เป้าหมาย: ผู้บริหารเห็นผลประกอบการ สุขภาพงาน และประเด็นที่ต้องพิจารณา

ขอบเขตงาน:
1. `/reports/executive` ตามนิยาม 05 §8 รวม summaryText (template) และ attention items (rule-based)
2. หน้า `/exec` ตาม executive_dashboard.html (header navy/gold): summary, KPI การเงิน + delta, trend, backlog aging, ตัวชี้วัด, branch ranking, vendor concentration, CX trend + mini blocks, attention items
3. Export PDF `/documents/reports/executive?period=` (A4 landscape)
4. cron `report.snapshot` รายวันถ้าจำเป็นต่อความเร็ว

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
| 1 | login exec เปลี่ยน period ทั้ง 4 แบบ | ตัวเลขเปลี่ยนตาม ไม่ error | ☐ |
| 2 | อ่าน Executive Summary | ชื่อสาขา/ตัวเลขตรงกับกราฟด้านล่าง | ☐ |
| 3 | กดส่งออก PDF | ได้ไฟล์อ่านง่าย ไม่มีปุ่มควบคุมติดมา | ☐ |
| 4 | ปิด canViewCost ของ EXECUTIVE | ส่วนการเงินถูกซ่อน | ☐ |
| 5 | `pnpm lint && pnpm typecheck && pnpm test` | ผ่านทั้งหมด | ☐ |

## ④ บันทึกงาน
```bash
git add -A
git commit -m "feat(reports): executive dashboard and pdf export"
git tag step-26
```

## ถ้าไม่ผ่าน
- ข้อไหนไม่ผ่าน → ใช้ **Prompt แก้ปัญหา** ใน [README](README.md#prompt-แก้ปัญหา) แนบ error/ภาพหน้าจอ
- อยากเริ่ม step นี้ใหม่ทั้งหมด → `git reset --hard step-25 && git clean -fd`
